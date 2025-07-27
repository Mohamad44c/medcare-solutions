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

    // Get scopes that have approved quotations
    const scopes = await payload.find({
      collection: 'scopes',
      where: {
        id: {
          in: approvedScopeIds,
        },
      },
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      scopes: scopes.docs,
    })
  } catch (error) {
    console.error('Error fetching filtered scopes:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch filtered scopes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
