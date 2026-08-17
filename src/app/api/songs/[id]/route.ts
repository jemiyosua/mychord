import { getSongById, updateSong, deleteSong } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const song = await getSongById(id);

  if (!song) {
    return Response.json({ error: 'Song not found' }, { status: 404 });
  }

  return Response.json(song);
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { title, artist, content, originalKey } = body;

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  const song = await updateSong(id, title, artist || '', content || '', originalKey || 'C');
  if (!song) {
    return Response.json({ error: 'Song not found' }, { status: 404 });
  }

  return Response.json(song);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const success = await deleteSong(id);

  if (!success) {
    return Response.json({ error: 'Song not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
