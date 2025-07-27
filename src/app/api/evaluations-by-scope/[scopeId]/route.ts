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

    // Get the scope with its evaluations
    const scope = await payload.findByID({
      collection: 'scopes',
      id: scopeId,
      depth: 1,
    })

    if (!scope) {
      return NextResponse.json({ error: 'Scope not found' }, { status: 404 })
    }

    // Get evaluations for this scope
    const evaluationsResult = await payload.find({
      collection: 'evaluation',
      where: {
        scope: {
          equals: scopeId,
        },
      },
      depth: 1,
    })
    const evaluations = evaluationsResult.docs

    return NextResponse.json({
      success: true,
      scope: {
        id: scope.id,
        code: scope.code,
        name: scope.name,
      },
      evaluations: evaluations,
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
