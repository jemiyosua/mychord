import { getSongsByCollection, createSong, getCollectionById } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
  const { id } = await ctx.params;
  const songs = await getSongsByCollection(id);
  return Response.json(songs);
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
  const { id } = await ctx.params;

  const collection = await getCollectionById(id);
  if (!collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  const body = await req.json();
  const { title, artist, content, originalKey } = body;

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  const song = await createSong(id, title, artist || '', content || '', originalKey || 'C');
  return Response.json(song, { status: 201 });
}
