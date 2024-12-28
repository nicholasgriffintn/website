import { getAuthSession } from '@/lib/auth';

export async function GET() {
  const { user } = await getAuthSession();

  return Response.json({ user });
}
