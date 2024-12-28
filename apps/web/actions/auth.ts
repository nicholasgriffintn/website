'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { user as userTable } from 'website-database/schema';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/data/db';
import {
  getAuthSession,
  getFullAuthSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

export async function handleGetSession() {
  'use server';

  const { user } = await getAuthSession();

  return { user };
}

export async function handleGetMe() {
  'use server';

  const { user } = await getFullAuthSession();

  return { user };
}

export async function handleGetUser({ userId }) {
  'use server';

  if (!userId) {
    return { error: 'User ID is required' };
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.github_username, userId),
  });

  if (!user) {
    return { error: 'User not found' };
  }

  return { user };
}

export async function handleLogout() {
  'use server';
  const cookieStore = await cookies();

  const { session } = await getAuthSession({ refreshCookie: false });
  // TODO: Session isn't returning ID, it needs to to do this.
  // @ts-expect-error
  if (!session || !session.id) {
    redirect('/');
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  // TODO: Session isn't returning ID, it needs to to do this.
  // @ts-expect-error
  await invalidateSession(session.id);

  redirect('/');
}

/**
 * @deprecated Use `handleLogin` instead
 */
export async function handleTokenLogin(formData: FormData) {
  'use server';

  const token = formData.get('token') as string;
  if (!token) {
    return { error: 'Token is required' };
  }
  const redirectUrl = formData.get('redirectUrl') as string | '/';
  if (!redirectUrl) {
    return { error: 'Redirect URL is required' };
  }

  const systemAuthToken = process.env.AUTH_TOKEN || '';
  if (token !== systemAuthToken) {
    return { error: 'Invalid token' };
  }

  const cookieStore = await cookies();

  cookieStore.set('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  revalidatePath(redirectUrl);
}
