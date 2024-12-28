import type { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/lib/data/db';
import { user as userTable } from '@/lib/data/db/schema';

export async function GET(_request: NextRequest, { params }) {
  const paramValues = await params;
  const userId = paramValues.userId;

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 });
  }

  const user = await db.query.user.findFirst({
    where: eq(userTable.github_username, userId),
  });

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  return Response.json({ user });
}
