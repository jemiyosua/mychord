import { reorderSongs } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/reorder'>) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { songIds } = body;

  if (!songIds || !Array.isArray(songIds)) {
    return Response.json({ error: 'songIds array is required' }, { status: 400 });
  }

  await reorderSongs(id, songIds);
  return Response.json({ success: true });
}
