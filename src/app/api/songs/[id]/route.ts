import { goGetSongs, goSaveSong } from '@/lib/go-api';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const token = req.headers.get('X-Auth-Token') || '';
  const userId = parseInt(req.headers.get('X-User-Id') || '0', 10);

  if (!token || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await goGetSongs({
      token,
      user_id: userId,
      song_id: parseInt(id, 10),
    });

    if (result.error_code !== '0') {
      return Response.json({ error: result.error_message }, { status: 404 });
    }

    // Map Go API response to frontend Song format
    const song = result.result as { id: number; user_id: number; title: string; artist: string; chord_content: string; original_key: string; genre: string; reference_link: string; tgl_input: string; tgl_update: string };
    return Response.json({
      id: String(song.id),
      collectionId: '',
      title: song.title,
      artist: song.artist,
      content: song.chord_content,
      originalKey: song.original_key,
      referenceLink: song.reference_link || '',
      order: 0,
      createdAt: song.tgl_input,
      updatedAt: song.tgl_update,
    });
  } catch (error) {
    console.error('Get song error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const token = req.headers.get('X-Auth-Token') || '';
  const userId = parseInt(req.headers.get('X-User-Id') || '0', 10);

  if (!token || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, artist, content, originalKey } = body;

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 });
  }

  try {
    const result = await goSaveSong({
      method: 'UPDATE',
      token,
      user_id: userId,
      song_id: parseInt(id, 10),
      title,
      artist: artist || '',
      chord_content: content || '',
      original_key: originalKey || 'C',
    });

    if (result.error_code !== '0') {
      return Response.json({ error: result.error_message }, { status: 400 });
    }

    return Response.json({
      id,
      title,
      artist: artist || '',
      content: content || '',
      originalKey: originalKey || 'C',
    });
  } catch (error) {
    console.error('Update song error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/songs/[id]'>) {
  const { id } = await ctx.params;
  const token = req.headers.get('X-Auth-Token') || '';
  const userId = parseInt(req.headers.get('X-User-Id') || '0', 10);

  if (!token || !userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await goSaveSong({
      method: 'DELETE',
      token,
      user_id: userId,
      song_id: parseInt(id, 10),
      title: 'deleted',
      chord_content: 'deleted',
    });

    if (result.error_code !== '0') {
      return Response.json({ error: result.error_message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete song error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
