import { getCollectionByShareId, getSongsByCollection } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/share/[shareId]'>) {
  const { shareId } = await ctx.params;
  const collection = await getCollectionByShareId(shareId);

  if (!collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  const songs = await getSongsByCollection(collection.id);

  return Response.json({ collection, songs });
}
