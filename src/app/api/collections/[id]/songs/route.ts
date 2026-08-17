import { goGetSongs, goSaveSong, type SongResult } from '@/lib/go-api';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
  // Collection ID is not used in Go API (songs are per user, not per collection)
  // We fetch all songs for the user
  const token = req.headers.get('X-Auth-Token') || '';
  const userId = parseInt(req.headers.get('X-User-Id') || '0', 10);

  // Allow unauthenticated access for backwards compat (will return empty)
  if (!token || !userId) {
    return Response.json([]);
  }

  try {
    const result = await goGetSongs({
      token,
      user_id: userId,
      page: 1,
      row_page: 100,
    });

    if (result.error_code !== '0') {
      return Response.json([]);
    }

    // Map Go API response to frontend Song[] format
    const songs = Array.isArray(result.result) ? result.result : [];
    const mapped = songs.map((song: SongResult, idx: number) => ({
      id: String(song.id),
      collectionId: (ctx as { params: Promise<{ id: string }> }).params ? '' : '',
      title: song.title,
      artist: song.artist,
      content: song.chord_content,
      originalKey: song.original_key,
      order: idx + 1,
      createdAt: song.tgl_input,
      updatedAt: song.tgl_update,
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error('Get songs error:', error);
    return Response.json([]);
  }
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
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
      method: 'INSERT',
      token,
      user_id: userId,
      title,
      artist: artist || '',
      chord_content: content || '',
      original_key: originalKey || 'C',
    });

    if (result.error_code !== '0') {
      return Response.json({ error: result.error_message }, { status: 400 });
    }

    const songId = result.result?.song_id || '0';

    return Response.json({
      id: songId,
      collectionId: '',
      title,
      artist: artist || '',
      content: content || '',
      originalKey: originalKey || 'C',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create song error:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
