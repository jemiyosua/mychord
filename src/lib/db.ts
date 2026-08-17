import { neon } from '@neondatabase/serverless';
import { v4 as uuidv4 } from 'uuid';
import type { Collection, Song } from './types';

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// ============ Schema Migration ============

export async function initializeDatabase(): Promise<void> {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      share_id TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS songs (
      id TEXT PRIMARY KEY,
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      artist TEXT DEFAULT '',
      content TEXT DEFAULT '',
      original_key TEXT DEFAULT 'C',
      song_order INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
}

// ============ Collections ============

export async function getCollections(): Promise<Collection[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM collections ORDER BY created_at DESC`;
  return rows.map(mapCollection);
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM collections WHERE id = ${id}`;
  return rows.length > 0 ? mapCollection(rows[0]) : undefined;
}

export async function getCollectionByShareId(shareId: string): Promise<Collection | undefined> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM collections WHERE share_id = ${shareId}`;
  return rows.length > 0 ? mapCollection(rows[0]) : undefined;
}

export async function createCollection(name: string, description: string): Promise<Collection> {
  const sql = getDb();
  const id = uuidv4();
  const shareId = uuidv4().slice(0, 8);
  const now = new Date().toISOString();

  await sql`
    INSERT INTO collections (id, name, description, share_id, created_at, updated_at)
    VALUES (${id}, ${name}, ${description}, ${shareId}, ${now}, ${now})
  `;

  return { id, name, description, shareId, createdAt: now, updatedAt: now };
}

export async function updateCollection(id: string, name: string, description: string): Promise<Collection | null> {
  const sql = getDb();
  const now = new Date().toISOString();

  const rows = await sql`
    UPDATE collections SET name = ${name}, description = ${description}, updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `;

  return rows.length > 0 ? mapCollection(rows[0]) : null;
}

export async function deleteCollection(id: string): Promise<boolean> {
  const sql = getDb();
  const result = await sql`DELETE FROM collections WHERE id = ${id}`;
  return (result as unknown as { count?: number }).count !== 0;
}

// ============ Songs ============

export async function getSongsByCollection(collectionId: string): Promise<Song[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM songs WHERE collection_id = ${collectionId} ORDER BY song_order ASC, created_at ASC
  `;
  return rows.map(mapSong);
}

export async function getSongById(id: string): Promise<Song | undefined> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM songs WHERE id = ${id}`;
  return rows.length > 0 ? mapSong(rows[0]) : undefined;
}

export async function createSong(
  collectionId: string,
  title: string,
  artist: string,
  content: string,
  originalKey: string
): Promise<Song> {
  const sql = getDb();
  const id = uuidv4();
  const now = new Date().toISOString();

  // Get the next order number
  const orderRows = await sql`
    SELECT COALESCE(MAX(song_order), 0) + 1 as next_order FROM songs WHERE collection_id = ${collectionId}
  `;
  const order = orderRows[0].next_order as number;

  await sql`
    INSERT INTO songs (id, collection_id, title, artist, content, original_key, song_order, created_at, updated_at)
    VALUES (${id}, ${collectionId}, ${title}, ${artist}, ${content}, ${originalKey}, ${order}, ${now}, ${now})
  `;

  return { id, collectionId, title, artist, content, originalKey, order, createdAt: now, updatedAt: now };
}

export async function updateSong(
  id: string,
  title: string,
  artist: string,
  content: string,
  originalKey: string
): Promise<Song | null> {
  const sql = getDb();
  const now = new Date().toISOString();

  const rows = await sql`
    UPDATE songs SET title = ${title}, artist = ${artist}, content = ${content}, original_key = ${originalKey}, updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `;

  return rows.length > 0 ? mapSong(rows[0]) : null;
}

export async function deleteSong(id: string): Promise<boolean> {
  const sql = getDb();
  const result = await sql`DELETE FROM songs WHERE id = ${id}`;
  return (result as unknown as { count?: number }).count !== 0;
}

export async function reorderSongs(collectionId: string, songIds: string[]): Promise<boolean> {
  const sql = getDb();
  for (let i = 0; i < songIds.length; i++) {
    await sql`
      UPDATE songs SET song_order = ${i + 1} WHERE id = ${songIds[i]} AND collection_id = ${collectionId}
    `;
  }
  return true;
}

// ============ Mappers ============

function mapCollection(row: Record<string, unknown>): Collection {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    shareId: row.share_id as string,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapSong(row: Record<string, unknown>): Song {
  return {
    id: row.id as string,
    collectionId: row.collection_id as string,
    title: row.title as string,
    artist: (row.artist as string) || '',
    content: (row.content as string) || '',
    originalKey: (row.original_key as string) || 'C',
    order: (row.song_order as number) || 0,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
