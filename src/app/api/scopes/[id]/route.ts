import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

// GET single scope by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { id } = params

    const scope = await payload.findByID({
      collection: 'scopes',
      id,
      depth: 2, // Include related data
    })

    return NextResponse.json({
      success: true,
      data: scope,
    })
  } catch (error) {
    console.error('Error fetching scope:', error)
    return NextResponse.json({ success: false, error: 'Scope not found' }, { status: 404 })
  }
}

// PUT update scope by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { id } = params
    const body = await request.json()

    const scope = await payload.update({
      collection: 'scopes',
      id,
      data: body,
      req: request as any,
    })

    return NextResponse.json({
      success: true,
      data: scope,
    })
  } catch (error) {
    console.error('Error updating scope:', error)
    return NextResponse.json({ success: false, error: 'Failed to update scope' }, { status: 500 })
  }
}

// DELETE scope by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { id } = params

    await payload.delete({
      collection: 'scopes',
      id,
      req: request as any,
    })

    return NextResponse.json({
      success: true,
      message: 'Scope deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting scope:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete scope' }, { status: 500 })
  }
}
