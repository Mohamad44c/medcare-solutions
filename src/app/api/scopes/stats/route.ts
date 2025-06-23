import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

// GET collection statistics
export async function GET() {
  try {
    const payload = await getPayloadHMR({ config: configPromise })

    // Get counts by status
    const statusCounts = await Promise.all([
      payload.count({ collection: 'scopes', where: { status: { equals: 'pending' } } }),
      payload.count({ collection: 'scopes', where: { status: { equals: 'evaluated' } } }),
      payload.count({ collection: 'scopes', where: { status: { equals: 'approved' } } }),
      payload.count({ collection: 'scopes', where: { status: { equals: 'denied' } } }),
      payload.count({ collection: 'scopes', where: { status: { equals: 'completed' } } }),
    ])

    // Get counts by type
    const typeCounts = await Promise.all([
      payload.count({ collection: 'scopes', where: { type: { equals: 'rigid' } } }),
      payload.count({ collection: 'scopes', where: { type: { equals: 'flexible' } } }),
    ])

    // Get total count
    const totalCount = await payload.count({ collection: 'scopes' })

    // Get recent scopes (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCount = await payload.count({
      collection: 'scopes',
      where: {
        createdAt: { greater_than: sevenDaysAgo.toISOString() },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount.totalDocs,
        recent: recentCount.totalDocs,
        byStatus: {
          pending: statusCounts[0].totalDocs,
          evaluated: statusCounts[1].totalDocs,
          approved: statusCounts[2].totalDocs,
          denied: statusCounts[3].totalDocs,
          completed: statusCounts[4].totalDocs,
        },
        byType: {
          rigid: typeCounts[0].totalDocs,
          flexible: typeCounts[1].totalDocs,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching scope statistics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 },
    )
  }
}
