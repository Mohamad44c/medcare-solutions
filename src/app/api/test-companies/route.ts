import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Fetch all companies
    const result = await payload.find({
      collection: 'companies',
      limit: 50,
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      count: result.totalDocs,
      companies: result.docs.map((company: any) => ({
        id: company.id,
        name: company.name,
        phoneNumber: company.phoneNumber,
        email: company.email,
        address: company.address,
        mofNumber: company.mofNumber,
        created: company.createdAt,
        updated: company.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch companies',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
