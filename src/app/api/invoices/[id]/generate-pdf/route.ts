import { NextRequest, NextResponse } from 'next/server'
import { PDFGenerator } from '../../../../../services/pdfGenerator'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = await getPayload({ config })
    const { id: invoiceId } = await params

    console.log('Starting invoice PDF generation for ID:', invoiceId)

    // Fetch the invoice with all related data
    const invoice = await payload.findByID({
      collection: 'invoices',
      id: invoiceId,
      depth: 2, // Include related data
    })

    if (!invoice) {
      return NextResponse.json(
        {
          error: 'Invoice not found',
          details: `No invoice found with ID: ${invoiceId}`,
        },
        { status: 404 },
      )
    }

    console.log('Invoice found:', invoice.invoiceNumber)

    // Fetch related scope data
    let scope = null
    if (invoice.scope) {
      const scopeId = typeof invoice.scope === 'string' ? invoice.scope : (invoice.scope as any).id
      scope = await payload.findByID({
        collection: 'scopes',
        id: scopeId,
        depth: 2,
      })
    }

    if (!scope) {
      return NextResponse.json({ error: 'Related scope not found' }, { status: 404 })
    }

    // Fetch related quotation data if exists
    let quotation = null
    if (invoice.quotation) {
      const quotationId =
        typeof invoice.quotation === 'string' ? invoice.quotation : (invoice.quotation as any).id
      quotation = await payload.findByID({
        collection: 'quotation',
        id: quotationId,
        depth: 1,
      })
    }

    // Fetch manufacturer data if exists
    let manufacturer = null
    if (scope.manufacturer) {
      const manufacturerId =
        typeof scope.manufacturer === 'string' ? scope.manufacturer : (scope.manufacturer as any).id
      manufacturer = await payload.findByID({
        collection: 'manufacturers',
        id: manufacturerId,
        depth: 1,
      })
    }

    // Fetch company data if exists (scope.company is text, not relationship)
    let company = null
    if (scope.company) {
      try {
        console.log('Looking for company:', scope.company)

        // Try to find company by name in the companies collection (case-insensitive)
        const companiesResult = await payload.find({
          collection: 'companies',
          where: {
            name: {
              like: scope.company,
            },
          },
          limit: 1,
        })

        console.log('Companies found:', companiesResult.docs.length)
        console.log('Search query:', { name: { like: scope.company } })
        if (companiesResult.docs.length > 0) {
          company = companiesResult.docs[0]
          console.log('Company data:', company)
        } else {
          console.log('No company found with name:', scope.company)
        }
      } catch (companyError) {
        console.warn('Could not fetch company data:', companyError)
        // Continue without company data
      }
    }

    // Prepare data for PDF generation
    console.log('Preparing invoice PDF data...')
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate || new Date().toISOString(),
      mofNumber: '513353-601', // This should be configurable or stored in the invoice
      scope: {
        name: scope.name,
        modelNumber: scope.modelNumber,
        serialNumber: scope.serialNumber,
        company: {
          name: scope.company || 'N/A',
          phone: company ? String((company as any).phoneNumber || 'N/A') : 'N/A',
          address: company ? (company as any).address || 'N/A' : 'N/A',
          mofNumber: company ? (company as any).mofNumber || 'N/A' : 'N/A',
        },
        manufacturer: manufacturer
          ? {
              title: (manufacturer as any).companyName,
            }
          : undefined,
      },
      quotation: quotation
        ? {
            serviceType: quotation.serviceType || 'N/A',
          }
        : undefined,
      unitPrice: invoice.unitPrice || 0,
      quantity: invoice.quantity || 0,
      totalPrice: invoice.totalPrice || 0,
      tax: invoice.tax || 0,
      totalDue: invoice.totalDue || 0,
      dueDate: invoice.dueDate || new Date().toISOString(),
      showTVAInLBP: invoice.showTVAInLBP || false,
    }

    console.log('Invoice PDF data prepared:', pdfData)

    // Generate PDF
    console.log('Generating invoice PDF...')
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(pdfData)
    console.log('Invoice PDF generated, buffer size:', pdfBuffer.length)

    // Upload PDF to S3 (if S3 is configured)
    let s3Url = null
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        })

        const fileName = `invoices/invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ContentDisposition: `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
          }),
        )

        s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`
        console.log('Invoice PDF uploaded to S3 successfully')
      }
    } catch (s3Error) {
      console.warn('S3 upload failed, will use data URL:', s3Error)
    }

    // Try to update invoice with PDF URL if S3 upload was successful
    if (s3Url) {
      try {
        await payload.update({
          collection: 'invoices',
          id: invoiceId,
          data: {
            pdfUrl: s3Url,
            pdfGeneratedAt: new Date().toISOString(),
          } as any,
        })
        console.log('Invoice updated with PDF URL')
      } catch (updateError) {
        console.warn('Could not update invoice with PDF URL:', updateError)
      }
    }

    // Return the PDF URL or data URL
    if (s3Url) {
      return NextResponse.json({
        success: true,
        pdfUrl: s3Url,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Invoice PDF generated and uploaded to S3 successfully',
      })
    } else {
      // Fallback to data URL if S3 is not available
      const base64PDF = pdfBuffer.toString('base64')
      const dataUrl = `data:application/pdf;base64,${base64PDF}`

      return NextResponse.json({
        success: true,
        pdfUrl: dataUrl,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Invoice PDF generated successfully (S3 upload failed, using data URL)',
      })
    }
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate invoice PDF',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
