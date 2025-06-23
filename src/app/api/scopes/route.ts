// app/api/scopes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayloadHMR } from '@payloadcms/next/utilities'
import configPromise from '@/payload.config'

// GET all scopes
export async function GET(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || '-createdAt'
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const brand = searchParams.get('brand')
    const manufacturer = searchParams.get('manufacturer')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (status) where.status = { equals: status }
    if (type) where.type = { equals: type }
    if (brand) where.brand = { equals: brand }
    if (manufacturer) where.manufacturer = { equals: manufacturer }

    // Add search functionality
    if (search) {
      where.or = [
        { name: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
        { Company: { contains: search } },
      ]
    }

    const result = await payload.find({
      collection: 'scopes',
      where,
      page,
      limit,
      sort,
      depth: 2, // Include related brand and manufacturer data
    })

    return NextResponse.json({
      success: true,
      data: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('Error fetching scopes:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch scopes' }, { status: 500 })
  }
}

// POST create new scope
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadHMR({ config: configPromise })
    const body = await request.json()

    const scope = await payload.create({
      collection: 'scopes',
      data: body,
      req: request as any, // This ensures the beforeChange hook can access req.user
    })

    return NextResponse.json(
      {
        success: true,
        data: scope,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creating scope:', error)
    return NextResponse.json({ success: false, error: 'Failed to create scope' }, { status: 500 })
  }
}
