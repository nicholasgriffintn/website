import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateState } from 'arctic';
import { NextRequest } from 'next/server';
import { github } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const url = req.url || '';
  const newUrl = new URL(url);
  const redirectUrl = newUrl.searchParams.get('redirectUrl') || '';

  const cookieStore = await cookies();

  const state = generateState();

  const authUrl = github.createAuthorizationURL(state, ['user:email']);

  cookieStore.set('github_oauth_state', state, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: 'lax',
  });

  if (redirectUrl) {
    cookieStore.set('github_oauth_redirect', redirectUrl, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: 'lax',
    });
  }

  redirect(authUrl.toString());
}
