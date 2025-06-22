import { getPayload } from 'payload'
import { NextResponse } from 'next/server'
import config from '@/payload.config'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const payload = await getPayload({ config })

    const result = await payload.login({
      collection: 'users',
      data: {
        email,
        password,
      },
    })

    // Set the payload token as an HTTP-only cookie
    const response = NextResponse.json({ success: true }, { status: 200 })

    // Set the payload token as an HTTP-only cookie
    response.cookies.set('payload-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || 'An error occurred during login',
      },
      { status: 401 },
    )
  }
}
