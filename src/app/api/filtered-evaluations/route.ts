import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Get all quotations with approved status
    const approvedQuotations = await payload.find({
      collection: 'quotation',
      where: {
        quotationStatus: {
          equals: 'approved',
        },
      },
      depth: 1,
    })

    // Extract unique scope IDs from approved quotations
    const approvedScopeIds = [
      ...new Set(
        approvedQuotations.docs
          .map((q) => {
            if (typeof q.scope === 'object' && q.scope.id) {
              return q.scope.id
            }
            return q.scope
          })
          .filter((id) => id && typeof id === 'string'),
      ),
    ]

    // Get evaluations that have scopes with approved quotations
    const evaluations = await payload.find({
      collection: 'evaluation',
      where: {
        scope: {
          in: approvedScopeIds,
        },
      },
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      evaluations: evaluations.docs,
    })
  } catch (error) {
    console.error('Error fetching filtered evaluations:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch filtered evaluations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
