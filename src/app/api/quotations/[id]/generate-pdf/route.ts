import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { PDFGenerator } from '../../../../../services/pdfGenerator'
import config from '../../../../../payload.config'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('Starting PDF generation...')

    const payload = await getPayload({
      config,
    })

    const { id } = await params

    if (!id) {
      return NextResponse.json({ message: 'Quotation ID is required' }, { status: 400 })
    }

    let quotation
    try {
      quotation = await payload.findByID({
        collection: 'quotation',
        id,
        depth: 2,
      })
    } catch (findError) {
      console.error('Error in findByID:', findError)
      console.error('Find error details:', {
        collection: 'quotation',
        id,
        errorMessage: findError instanceof Error ? findError.message : 'Unknown error',
        errorStack: findError instanceof Error ? findError.stack : 'No stack trace',
      })
      throw findError
    }

    if (!quotation) {
      return NextResponse.json({ message: 'Quotation not found' }, { status: 404 })
    }

    if (!quotation.scope) {
      return NextResponse.json({ message: 'Quotation must have a scope' }, { status: 400 })
    }

    // Fetch scope details
    console.log('Fetching scope...')
    const scopeId = (quotation.scope as any)?.id || quotation.scope
    const scope = await payload.findByID({
      collection: 'scopes',
      id: scopeId,
      depth: 2,
    })
    console.log('Scope fetched:', scope?.name)
    console.log('Full scope data:', JSON.stringify(scope, null, 2))
    console.log('Scope.Company value:', scope?.company)
    console.log('Scope.Company type:', typeof scope?.company)

    // Fetch brand details if available
    let brandData = null
    if (scope.brand) {
      console.log('Fetching brand...')
      const brandId = (scope.brand as any)?.id || scope.brand
      try {
        const brand = await payload.findByID({
          collection: 'brands',
          id: brandId,
        })
        brandData = {
          title: brand.title || 'N/A',
        }
        console.log('Brand fetched:', brandData.title)
      } catch (brandError) {
        console.warn('Could not fetch brand:', brandError)
        brandData = { title: 'N/A' }
      }
    } else {
      console.log('No brand reference found in scope')
      brandData = { title: 'N/A' }
    }

    // Fetch company details
    console.log('Fetching company...')
    let companyData = { name: 'N/A', phone: 'N/A', address: 'N/A' }

    // First, let's see what companies exist
    console.log('Listing all companies to debug...')
    try {
      const allCompanies = await payload.find({
        collection: 'companies',
        limit: 10,
        depth: 0,
      })
      console.log(
        'All companies found:',
        allCompanies.docs.map((c) => ({ id: c.id, name: c.name })),
      )
    } catch (listError) {
      console.error('Error listing companies:', listError)
    }

    // Company data should be populated from the scope relationship
    if (scope.company) {
      console.log('Company data from scope:', scope.company)
      companyData = {
        name: (scope.company as any).name || 'N/A',
        phone: (scope.company as any).phoneNumber
          ? String((scope.company as any).phoneNumber)
          : 'N/A',
        address: (scope.company as any).address || 'N/A',
      }
      console.log('Company data prepared:', companyData)
    } else {
      console.log('No company reference found in scope')
    }

    // Prepare data for PDF generation
    console.log('Preparing PDF data...')
    const pdfData = {
      quotationNumber: quotation.quotationNumber,
      quotationDate: quotation.quotationDate || new Date().toISOString(),
      offerValidity: quotation.offerValidity || '',
      scope: {
        name: scope.name,
        modelNumber: scope.modelNumber,
        serialNumber: scope.serialNumber,
        receivedDate: scope.receivedDate || '',
        company: companyData,
        brand: brandData,
      },
      deliveryPeriod: quotation.deliveryPeriod || 0,
      problems: quotation.problems,
      serviceType: quotation.serviceType,
      price: quotation.price,
      discount: quotation.discount || 0,
      notes: quotation.notes || '',
    }
    console.log('PDF data prepared:', pdfData)

    // Generate PDF
    console.log('Generating PDF...')
    const pdfBuffer = await PDFGenerator.generateQuotationPDF(pdfData)
    console.log('PDF generated, buffer size:', pdfBuffer.length)

    // Upload PDF to S3
    console.log('Uploading PDF to S3...')
    const fileName = `quotations/quotation-${quotation.quotationNumber}-${Date.now()}.pdf`

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`,
      })

      await s3Client.send(uploadCommand)
      console.log('PDF uploaded to S3 successfully')

      // Generate S3 URL
      const s3Url = process.env.S3_ENDPOINT
        ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`
        : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`

      // Note: pdfUrl and pdfGeneratedAt fields were removed from Quotation collection
      // PDF URL is returned in the response instead

      console.log('Returning success response')
      return NextResponse.json({
        success: true,
        pdfUrl: s3Url,
        quotationNumber: quotation.quotationNumber,
        message: 'PDF generated and uploaded to S3 successfully',
      })
    } catch (s3Error) {
      console.error('Error uploading to S3:', s3Error)

      // Fallback to base64 if S3 upload fails
      const base64PDF = pdfBuffer.toString('base64')
      const dataUrl = `data:application/pdf;base64,${base64PDF}`

      return NextResponse.json({
        success: true,
        pdfUrl: dataUrl,
        quotationNumber: quotation.quotationNumber,
        message: 'PDF generated successfully (S3 upload failed, using data URL)',
      })
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : 'No stack trace',
      },
      { status: 500 },
    )
  }
}
