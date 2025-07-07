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
    console.log('Scope.Company value:', scope?.Company)
    console.log('Scope.Company type:', typeof scope?.Company)

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

    if (scope.Company) {
      console.log('Scope has company reference:', scope.Company)
      const companyName = scope.Company
      console.log('Company name to search for:', companyName)

      try {
        // Search for company by name instead of ID (case-insensitive)
        const companies = await payload.find({
          collection: 'companies',
          limit: 10,
        })

        // Find company by name (case-insensitive)
        const company = companies.docs.find(
          (c) =>
            c.name.toLowerCase().includes(companyName.toLowerCase()) ||
            companyName.toLowerCase().includes(c.name.toLowerCase()),
        )

        if (company) {
          companyData = {
            name: company.name || 'N/A',
            phone: company.phoneNumber ? company.phoneNumber.toString() : 'N/A',
            address: company.address || 'N/A',
          }
          console.log('Company fetched:', companyData.name)
          console.log('Company phone:', companyData.phone)
          console.log('Company address:', companyData.address)
        } else {
          console.log('No company found with name:', companyName)
        }
      } catch (companyError) {
        console.warn('Could not fetch company:', companyError)
        console.log('Using default company data')
        // Continue with default company data
      }
    } else {
      console.log('No company reference found in scope')
    }

    // Prepare data for PDF generation
    console.log('Preparing PDF data...')
    const pdfData = {
      quotation_number: quotation.quotation_number,
      quotation_date: quotation.quotation_date || new Date().toISOString(),
      offer_validity: quotation.offer_validity || '',
      scope: {
        name: scope.name,
        modelNumber: scope.modelNumber,
        serialNumber: scope.serialNumber,
        receivedDate: scope.receivedDate || '',
        company: companyData,
        brand: brandData,
      },
      delivery_period: quotation.delivery_period || 0,
      problems: quotation.problems,
      service_type: quotation.service_type,
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
    const fileName = `quotations/quotation-${quotation.quotation_number}-${Date.now()}.pdf`

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="quotation-${quotation.quotation_number}.pdf"`,
      })

      await s3Client.send(uploadCommand)
      console.log('PDF uploaded to S3 successfully')

      // Generate S3 URL
      const s3Url = process.env.S3_ENDPOINT
        ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`
        : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`

      // Update quotation with PDF URL
      try {
        await payload.update({
          collection: 'quotation',
          id,
          data: {
            pdf_url: s3Url,
            pdf_generated_at: new Date().toISOString(),
          },
        })
        console.log('Quotation updated with PDF URL')
      } catch (updateError) {
        console.warn('Could not update quotation with PDF URL:', updateError)
      }

      console.log('Returning success response')
      return NextResponse.json({
        success: true,
        pdfUrl: s3Url,
        quotationNumber: quotation.quotation_number,
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
        quotationNumber: quotation.quotation_number,
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
