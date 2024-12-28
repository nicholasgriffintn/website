import { cookies } from 'next/headers';

import {
  getAuthSession,
  invalidateSession,
  SESSION_COOKIE_NAME,
} from '@/lib/auth';

export async function POST() {
  const cookieStore = await cookies();

  const { session } = await getAuthSession({ refreshCookie: false });
  if (!session) {
    return new Response('Success', {
      status: 301,
      headers: {
        Location: '/',
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  // TODO: Session isn't returning ID, it needs to to do this.
  // @ts-expect-error
  await invalidateSession(session.id);

  return new Response('Success', {
    status: 301,
    headers: {
      Location: '/',
    },
  });
}
