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

    const evaluation = await payload.findByID({
      collection: 'evaluation',
      id: parseInt(id),
      depth: 1,
    });

    return NextResponse.json({
      success: true,
      doc: evaluation,
    });
  } catch (error) {
    console.error('Error fetching evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch evaluation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
