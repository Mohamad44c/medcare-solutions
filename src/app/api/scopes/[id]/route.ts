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

    const scope = await payload.findByID({
      collection: 'scopes',
      id: parseInt(id),
      depth: 1,
    });

    return NextResponse.json({
      success: true,
      doc: scope,
    });
  } catch (error) {
    console.error('Error fetching scope:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch scope',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
