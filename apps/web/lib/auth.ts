import { cookies } from "next/headers";
import { sha256 } from '@oslojs/crypto/sha2';
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from '@oslojs/encoding';
import { GitHub } from 'arctic';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/data/db';
import {
  session as sessionTable,
  user as userTable,
  type Session,
} from '@/lib/data/db/schema';

export const SESSION_COOKIE_NAME = 'session';

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

export async function createSession(
  token: string,
  userId: number
): Promise<Session> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const session: Session = {
    id: sessionId,
    user_id: userId,
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
  await db.insert(sessionTable).values(session);
  return session;
}

export async function validateSessionToken(token: string) {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const now = Date.now();

  const results = await db
    .select({
      session: {
        user_id: sessionTable.user_id,
        expires_at: sessionTable.expires_at,
      },
      user: {
        name: userTable.name,
        avatar_url: userTable.avatar_url,
        email: userTable.email,
      },
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.user_id, userTable.id))
    .where(eq(sessionTable.id, sessionId));

  if (results.length < 1 || !results[0]) {
    return { session: null, user: null };
  }

  const { session, user } = results[0];
  const expiresAt = new Date(session.expires_at).getTime();

  if (now >= expiresAt) {
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
    return { session: null, user: null };
  }

  const shouldExtend = now >= expiresAt - 1000 * 60 * 60 * 24 * 15;
  if (shouldExtend) {
    session.expires_at = new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString();
    db.update(sessionTable)
      .set({
        expires_at: session.expires_at,
      })
      .where(eq(sessionTable.id, sessionId))
      .catch(console.error);
  }

  return { session, user };
}

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof validateSessionToken>>['user']
>;

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export function setSessionTokenCookie(
  cookieStore,
  token: string,
  expiresAt: Date
) {
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
}

// OAuth2 Providers
export const github = new GitHub(
  process.env.GITHUB_CLIENT_ID as string,
  process.env.GITHUB_CLIENT_SECRET as string,
  process.env.GITHUB_REDIRECT_URI || null
);

/**
 * Retrieves the session and user data if valid.
 * Can be used in API routes and server functions.
 */
export async function getAuthSession(
  { refreshCookie } = { refreshCookie: true }
) {
  const cookieStore = await cookies();

  const token = cookieStore.get(SESSION_COOKIE_NAME);
  const tokenValue = token?.value;
  if (!tokenValue) {
    return { session: null, user: null };
  }

  const { session, user } = await validateSessionToken(tokenValue);

  if (refreshCookie) {
    if (session === null) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return { session: null, user: null };
    }

    setSessionTokenCookie(
      cookieStore,
      tokenValue,
      new Date(session.expires_at)
    );
  }

  return { session, user };
}

export async function getFullAuthSession() {
  const { session, user } = await getAuthSession();

  if (!session) {
    return { session: null, user: null };
  }

  if (user && user.email) {
    const userData = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, user.email));
    return { session, user: userData[0] };
  }

  return { session, user: null };
}
