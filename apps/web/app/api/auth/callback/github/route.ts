import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { OAuth2RequestError } from 'arctic';
import { and, eq } from 'drizzle-orm';

import {
  createSession,
  generateSessionToken,
  github,
  setSessionTokenCookie,
} from '@/lib/auth';
import type { GitHubUser } from '@/types/auth';
import { db } from '@/lib/data/db';
import { oauthAccount, user } from '@/lib/data/db/schema';

const PROVIDER_ID = 'github';

export async function GET(request: NextRequest) {
  const url = request.url || '';
  const newUrl = new URL(url);
  const code = newUrl.searchParams.get('code') || '';
  const state = newUrl.searchParams.get('state') || '';

  const cookieStore = await cookies();

  const storedState = cookieStore.get('github_oauth_state');
  const storedStateValue = storedState?.value;

  if (!code || !state || !storedStateValue) {
    return new Response('Incorrect params provided', {
      status: 400,
    });
  }

  console.log({
    code,
    state,
    storedStateValue,
  });

  if (state !== storedStateValue) {
    return new Response('Incorrect state provided', {
      status: 400,
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const providerUser: GitHubUser = await githubUserResponse.json();

    const existingUser = await db.query.oauthAccount.findFirst({
      where: and(
        eq(oauthAccount.provider_id, PROVIDER_ID),
        eq(oauthAccount.provider_user_id, providerUser.id)
      ),
    });

    if (existingUser?.user_id) {
      const token = generateSessionToken();
      const session = await createSession(token, existingUser.user_id);
      setSessionTokenCookie(cookieStore, token, new Date(session.expires_at));

      return new Response('Success', {
        status: 301,
        headers: {
          Location: '/',
        },
      });
    }

    const existingUserEmail = await db.query.user.findFirst({
      where: eq(user.email, providerUser.email),
    });

    if (existingUserEmail?.id) {
      await db.insert(oauthAccount).values({
        provider_id: PROVIDER_ID,
        provider_user_id: providerUser.id,
        user_id: existingUserEmail.id,
      });
      const token = generateSessionToken();
      const session = await createSession(token, existingUserEmail.id);
      setSessionTokenCookie(cookieStore, token, new Date(session.expires_at));

      return new Response('Success', {
        status: 301,
        headers: {
          Location: '/',
        },
      });
    }

    const userId = await db
      .insert(user)
      .values({
        email: providerUser.email,
        name: providerUser.name || providerUser.login,
        avatar_url: providerUser.avatar_url,
        github_username: providerUser.login,
        company: providerUser.company,
        site: providerUser.blog,
        location: providerUser.location,
        bio: providerUser.bio,
        twitter_username: providerUser.twitter_username,
      })
      .returning({ id: user.id });

    if (!userId?.[0]?.id) {
      return new Response('User was not be found', {
        status: 404,
      });
    }

    await db.insert(oauthAccount).values({
      provider_id: PROVIDER_ID,
      provider_user_id: providerUser.id,
      user_id: userId[0].id,
    });

    const token = generateSessionToken();
    const session = await createSession(token, userId[0].id);
    setSessionTokenCookie(cookieStore, token, new Date(session.expires_at));

    return new Response('Success', {
      status: 301,
      headers: {
        Location: '/',
      },
    });
  } catch (e) {
    console.error(e);
    if (e instanceof OAuth2RequestError) {
      return new Response('User could not be signed in', {
        status: 400,
      });
    }
    return new Response('Internal Server Error', {
      status: 500,
    });
  }
}
