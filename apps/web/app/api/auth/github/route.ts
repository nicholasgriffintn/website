import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateState } from 'arctic';

import { github } from '@/lib/auth';

export async function GET() {
  const cookieStore = await cookies();

  const state = generateState();

  const url = github.createAuthorizationURL(state, ['user:email']);

  cookieStore.set('github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });

  redirect(url.toString());
}
