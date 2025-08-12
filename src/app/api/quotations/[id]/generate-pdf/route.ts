import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import { PDFGenerator } from '../../../../../services/pdfGenerator';
import config from '../../../../../payload.config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
});

/**
 * Generate quotation PDF and upload to S3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quotation ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch quotation with related data
    const quotation = await payload.findByID({
      collection: 'quotation',
      id,
      depth: 2,
    });

    if (!quotation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quotation not found',
        },
        { status: 404 }
      );
    }

    if (!quotation.scope) {
      return NextResponse.json(
        {
          success: false,
          message: 'Quotation must have a scope',
        },
        { status: 400 }
      );
    }

    // Fetch scope details
    const scopeId = (quotation.scope as any)?.id || quotation.scope;
    const scope = await payload.findByID({
      collection: 'scopes',
      id: scopeId,
      depth: 2,
    });

    if (!scope) {
      return NextResponse.json(
        {
          success: false,
          message: 'Related scope not found',
        },
        { status: 404 }
      );
    }

    // Fetch brand details if available
    let brandData = { title: 'N/A' };
    if (scope.brand) {
      try {
        const brandId = (scope.brand as any)?.id || scope.brand;
        const brand = await payload.findByID({
          collection: 'brands',
          id: brandId,
        });
        brandData = { title: brand.title || 'N/A' };
      } catch (error) {
        console.warn('Could not fetch brand:', error);
      }
    }

    // Prepare company data from scope relationship
    const companyData = {
      name: (scope.company as any)?.name || 'N/A',
      phone: (scope.company as any)?.phoneNumber
        ? String((scope.company as any).phoneNumber)
        : 'N/A',
      address: (scope.company as any)?.address || 'N/A',
    };

    // Prepare data for PDF generation
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
    };

    // Generate PDF using our updated PDFGenerator
    const pdfBuffer = await PDFGenerator.generateQuotationPDF(pdfData);

    // Upload PDF to S3
    const fileName = `quotations/quotation-${quotation.quotationNumber}-${Date.now()}.pdf`;
    let s3Url = null;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
        ContentDisposition: `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`,
      });

      await s3Client.send(uploadCommand);

      s3Url = process.env.S3_ENDPOINT
        ? `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${fileName}`
        : `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;

      console.log('PDF uploaded to S3 successfully');
    } catch (s3Error) {
      console.warn('S3 upload failed, will use data URL:', s3Error);
    }

    // Return success response
    if (s3Url) {
      return NextResponse.json({
        success: true,
        pdfUrl: s3Url,
        quotationNumber: quotation.quotationNumber,
        message: 'PDF generated and uploaded to S3 successfully',
      });
    } else {
      // Fallback to base64 if S3 upload fails
      const base64PDF = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64PDF}`;

      return NextResponse.json({
        success: true,
        pdfUrl: dataUrl,
        quotationNumber: quotation.quotationNumber,
        message:
          'PDF generated successfully (S3 upload failed, using data URL)',
      });
    }
  } catch (error) {
    console.error('Error generating quotation PDF:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
