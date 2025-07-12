import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    // Fetch all invoices with basic info
    const result = await payload.find({
      collection: 'invoices',
      limit: 50,
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      count: result.totalDocs,
      invoices: result.docs.map((invoice: any) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalDue: invoice.totalDue,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        created: invoice.createdAt,
        updated: invoice.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch invoices',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
