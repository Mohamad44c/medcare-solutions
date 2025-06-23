import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

// POST bulk operations
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { action, ids, data } = await request.json()

    let result

    switch (action) {
      case 'delete':
        result = await Promise.all(
          ids.map((id: string) =>
            payload.delete({
              collection: 'scopes',
              id,
              req: request as any,
            }),
          ),
        )
        break

      case 'update':
        result = await Promise.all(
          ids.map((id: string) =>
            payload.update({
              collection: 'scopes',
              id,
              data,
              req: request as any,
            }),
          ),
        )
        break

      case 'updateStatus':
        if (!data.status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for bulk status update' },
            { status: 400 },
          )
        }
        result = await Promise.all(
          ids.map((id: string) =>
            payload.update({
              collection: 'scopes',
              id,
              data: { status: data.status },
              req: request as any,
            }),
          ),
        )
        break

      default:
        return NextResponse.json({ success: false, error: 'Invalid bulk action' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `Bulk ${action} completed successfully`,
    })
  } catch (error) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform bulk operation' },
      { status: 500 },
    )
  }
}
