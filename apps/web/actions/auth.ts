'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/data/db';
import { user as userTable } from '@/lib/data/db/schema';
import {
  getAuthSession,
  getFullAuthSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

export async function handleGetSession() {
  const { user } = await getAuthSession();

  return { user };
}

export async function handleGetMe() {
  const { user } = await getFullAuthSession();

  return { user };
}

export async function handleGetUser({ userId }) {
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
