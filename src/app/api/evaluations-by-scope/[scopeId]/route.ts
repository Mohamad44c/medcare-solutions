import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scopeId: string }> },
) {
  try {
    const { scopeId } = await params
    const payload = await getPayload({ config })

    // Get evaluations for the specific scope
    const evaluations = await payload.find({
      collection: 'evaluation',
      where: {
        scope: {
          equals: scopeId,
        },
      },
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      evaluations: evaluations.docs,
    })
  } catch (error) {
    console.error('Error fetching evaluations by scope:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch evaluations by scope',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
