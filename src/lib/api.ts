import { NextResponse } from 'next/server'
import { createErrorResponse } from './errors'

/**
 * Create a successful API response
 */
export function createSuccessResponse<T = any>(
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status: statusCode },
  )
}

/**
 * Create an error API response
 */
export function createApiErrorResponse(error: Error, statusCode: number = 500) {
  const errorResponse = createErrorResponse(error)

  return NextResponse.json(errorResponse, { status: statusCode })
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T = any>(
  data: T[],
  page: number,
  limit: number,
  total: number,
  message: string = 'Success',
) {
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    success: true,
    message,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  })
}

/**
 * Create a file download response
 */
export function createFileResponse(
  buffer: Buffer,
  filename: string,
  contentType: string = 'application/octet-stream',
) {
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    },
  })
}

/**
 * Create a PDF response
 */
export function createPDFResponse(buffer: Buffer, filename: string) {
  return createFileResponse(buffer, filename, 'application/pdf')
}
