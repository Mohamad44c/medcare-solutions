'use server';

import { cookies } from 'next/headers';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { redirect } from 'next/navigation';
import { logout } from '@payloadcms/next/auth';

export type LoginFields = {
  email: string;
  password: string;
};

interface PayloadError extends Error {
  message: string;
  data?: unknown;
}

export async function loginAction(data: LoginFields) {
  try {
    const payload = await getPayload({ config });

    const result = await payload.login({
      collection: 'users',
      data: {
        email: data.email,
        password: data.password,
      },
    });

    const cookieStore = await cookies();
    if (!result.token) throw new Error('No token received');
    cookieStore.set('payload-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    redirect('/dashboard/scopes');
  } catch (error: unknown) {
    const err = error as PayloadError;
    return {
      success: false,
      error: err.message || 'An error occurred during login',
    };
  }
}

export async function logoutAction() {
  try {
    await logout({ config });

    const cookieStore = await cookies();
    cookieStore.delete('payload-token');
    redirect('/login');
  } catch (error: unknown) {
    const err = error as PayloadError;
    return {
      success: false,
      error: err.message || 'An error occurred during logout',
    };
  }
}
