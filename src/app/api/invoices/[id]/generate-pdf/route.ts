import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator } from '../../../../../services/pdfGenerator';
import { getPayload } from 'payload';
import config from '../../../../../payload.config';

/**
 * Generate invoice PDF and upload to S3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({ config });
    const { id: invoiceId } = await params;

    if (!invoiceId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice ID is required',
        },
        { status: 400 }
      );
    }

    // Fetch the invoice with all related data
    const invoice = await payload.findByID({
      collection: 'invoices',
      id: invoiceId,
      depth: 2,
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice not found',
        },
        { status: 404 }
      );
    }

    // Fetch related scope data
    if (!invoice.scope) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invoice must have a scope',
        },
        { status: 400 }
      );
    }

    const scopeId =
      typeof invoice.scope === 'string'
        ? invoice.scope
        : (invoice.scope as any).id;
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

    // Fetch related quotation data if exists
    let quotation = null;
    if (invoice.quotation) {
      try {
        const quotationId =
          typeof invoice.quotation === 'string'
            ? invoice.quotation
            : (invoice.quotation as any).id;
        quotation = await payload.findByID({
          collection: 'quotation',
          id: quotationId,
          depth: 1,
        });
      } catch (error) {
        console.warn('Could not fetch quotation:', error);
      }
    }

    // Fetch manufacturer data if exists
    let manufacturer = null;
    if (scope.manufacturer) {
      try {
        const manufacturerId =
          typeof scope.manufacturer === 'string'
            ? scope.manufacturer
            : (scope.manufacturer as any).id;
        manufacturer = await payload.findByID({
          collection: 'manufacturers',
          id: manufacturerId,
          depth: 1,
        });
      } catch (error) {
        console.warn('Could not fetch manufacturer:', error);
      }
    }

    // Prepare company data from scope relationship
    const company = scope.company;
    const companyData = {
      name: company ? (company as any).name || 'N/A' : 'N/A',
      phone: company ? String((company as any).phoneNumber || 'N/A') : 'N/A',
      address: company ? (company as any).address || 'N/A' : 'N/A',
      mofNumber: company ? (company as any).mofNumber || 'N/A' : 'N/A',
    };

    // Fetch dollar rate from settings
    let dollarRate = 89500; // Default fallback
    try {
      const settings = await payload.findGlobal({
        slug: 'settings',
      });
      dollarRate = settings.dollarRate || 89500;
    } catch (error) {
      console.warn(
        'Could not fetch dollar rate from settings, using default:',
        error
      );
    }

    // Prepare data for PDF generation
    const pdfData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate || new Date().toISOString(),
      mofNumber: '513353-601', // This should be configurable or stored in the invoice
      scope: {
        name: scope.name,
        modelNumber: scope.modelNumber,
        serialNumber: scope.serialNumber,
        company: companyData,
        manufacturer: manufacturer
          ? { title: (manufacturer as any).companyName }
          : undefined,
      },
      quotation: quotation
        ? { serviceType: quotation.serviceType || 'N/A' }
        : undefined,
      unitPrice: invoice.unitPrice || 0,
      totalPrice: invoice.totalPrice || 0,
      tax: invoice.tax || 0,
      totalDue: invoice.totalDue || 0,
      dueDate: invoice.dueDate || new Date().toISOString(),
      showTVAInLBP: invoice.showTVAInLBP || false,
      dollarRate,
    };

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateInvoicePDF(pdfData);

    // Upload PDF to S3 (if S3 is configured)
    let s3Url = null;
    try {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
        });

        const fileName = `invoices/invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: fileName,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ContentDisposition: `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
          })
        );

        s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
        console.log('Invoice PDF uploaded to S3 successfully');
      }
    } catch (error) {
      console.warn('S3 upload failed, will use data URL:', error);
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
        });
        console.log('Invoice updated with PDF URL');
      } catch (error) {
        console.warn('Could not update invoice with PDF URL:', error);
      }
    }

    // Return the PDF URL or data URL
    if (s3Url) {
      return NextResponse.json({
        success: true,
        pdfUrl: s3Url,
        invoiceNumber: invoice.invoiceNumber,
        message: 'Invoice PDF generated and uploaded to S3 successfully',
      });
    } else {
      // Fallback to data URL if S3 is not available
      const base64PDF = pdfBuffer.toString('base64');
      const dataUrl = `data:application/pdf;base64,${base64PDF}`;

      return NextResponse.json({
        success: true,
        pdfUrl: dataUrl,
        invoiceNumber: invoice.invoiceNumber,
        message:
          'Invoice PDF generated successfully (S3 upload failed, using data URL)',
      });
    }
  } catch (error) {
    console.error('Error generating invoice PDF:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate invoice PDF',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
