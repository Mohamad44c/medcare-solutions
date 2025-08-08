import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../../payload.config';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getPayload({
      config,
    });

    const { id } = await params;

    const quotation = await payload.findByID({
      collection: 'quotation',
      id: parseInt(id),
      depth: 1,
    });

    return NextResponse.json({
      success: true,
      doc: quotation,
    });
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch quotation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
