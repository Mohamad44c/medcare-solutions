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

    const evaluations = await payload.find({
      collection: 'evaluation',
      limit,
      page,
      depth: 1, // Include basic scope info
    });

    return NextResponse.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch evaluations',
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

    // Create the evaluation
    const evaluation = await payload.create({
      collection: 'evaluation',
      data: body,
    });

    return NextResponse.json({
      success: true,
      doc: evaluation,
    });
  } catch (error) {
    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create evaluation',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
