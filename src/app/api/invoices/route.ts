import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../payload.config';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({
      config,
    });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    const invoices = await payload.find({
      collection: 'invoices',
      limit,
      page,
      depth: 1,
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch invoices',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({
      config,
    });

    const body = await request.json();

    // Create the invoice
    const invoice = await payload.create({
      collection: 'invoices',
      data: body,
    });

    return NextResponse.json({
      success: true,
      doc: invoice,
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create invoice',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
