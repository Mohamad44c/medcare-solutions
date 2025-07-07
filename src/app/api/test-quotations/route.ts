import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../payload.config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({
      config,
    })

    console.log('Testing quotations endpoint...')

    // Get all quotations with minimal data
    const quotations = await payload.find({
      collection: 'quotation',
      limit: 5,
      depth: 0, // No relations
    })

    console.log('Found quotations:', quotations.docs.length)
    console.log(
      'Quotations data:',
      quotations.docs.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        created: q.createdAt,
        updated: q.updatedAt,
      })),
    )

    return NextResponse.json({
      success: true,
      count: quotations.docs.length,
      quotations: quotations.docs.map((q) => ({
        id: q.id,
        quotationNumber: q.quotationNumber,
        created: q.createdAt,
        updated: q.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error in test quotations endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch quotations',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
