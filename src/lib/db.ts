import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { AppData, Collection, Song } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function ensureDbExists(): Promise<void> {
  const dir = path.dirname(DB_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData: AppData = { collections: [], songs: [] };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

async function readDb(): Promise<AppData> {
  await ensureDbExists();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

async function writeDb(data: AppData): Promise<void> {
  await ensureDbExists();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// ============ Collections ============

export async function getCollections(): Promise<Collection[]> {
  const data = await readDb();
  return data.collections;
}

export async function getCollectionById(id: string): Promise<Collection | undefined> {
  const data = await readDb();
  return data.collections.find(c => c.id === id);
}

export async function getCollectionByShareId(shareId: string): Promise<Collection | undefined> {
  const data = await readDb();
  return data.collections.find(c => c.shareId === shareId);
}

export async function createCollection(name: string, description: string): Promise<Collection> {
  const data = await readDb();
  const collection: Collection = {
    id: uuidv4(),
    name,
    description,
    shareId: uuidv4().slice(0, 8),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.collections.push(collection);
  await writeDb(data);
  return collection;
}

export async function updateCollection(id: string, name: string, description: string): Promise<Collection | null> {
  const data = await readDb();
  const index = data.collections.findIndex(c => c.id === id);
  if (index === -1) return null;
  data.collections[index] = {
    ...data.collections[index],
    name,
    description,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(data);
  return data.collections[index];
}

export async function deleteCollection(id: string): Promise<boolean> {
  const data = await readDb();
  const index = data.collections.findIndex(c => c.id === id);
  if (index === -1) return false;
  data.collections.splice(index, 1);
  // Also delete all songs in this collection
  data.songs = data.songs.filter(s => s.collectionId !== id);
  await writeDb(data);
  return true;
}

// ============ Songs ============

export async function getSongsByCollection(collectionId: string): Promise<Song[]> {
  const data = await readDb();
  const songs = data.songs.filter(s => s.collectionId === collectionId);
  // Sort by order field
  return songs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getSongById(id: string): Promise<Song | undefined> {
  const data = await readDb();
  return data.songs.find(s => s.id === id);
}

export async function createSong(
  collectionId: string,
  title: string,
  artist: string,
  content: string,
  originalKey: string
): Promise<Song> {
  const data = await readDb();
  // Get the next order number
  const existingSongs = data.songs.filter(s => s.collectionId === collectionId);
  const maxOrder = existingSongs.reduce((max, s) => Math.max(max, s.order ?? 0), 0);

  const song: Song = {
    id: uuidv4(),
    collectionId,
    title,
    artist,
    content,
    originalKey,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.songs.push(song);
  await writeDb(data);
  return song;
}

export async function updateSong(
  id: string,
  title: string,
  artist: string,
  content: string,
  originalKey: string
): Promise<Song | null> {
  const data = await readDb();
  const index = data.songs.findIndex(s => s.id === id);
  if (index === -1) return null;
  data.songs[index] = {
    ...data.songs[index],
    title,
    artist,
    content,
    originalKey,
    updatedAt: new Date().toISOString(),
  };
  await writeDb(data);
  return data.songs[index];
}

export async function deleteSong(id: string): Promise<boolean> {
  const data = await readDb();
  const index = data.songs.findIndex(s => s.id === id);
  if (index === -1) return false;
  data.songs.splice(index, 1);
  await writeDb(data);
  return true;
}

export async function reorderSongs(collectionId: string, songIds: string[]): Promise<boolean> {
  const data = await readDb();
  // Update order for each song based on its position in the array
  for (let i = 0; i < songIds.length; i++) {
    const index = data.songs.findIndex(s => s.id === songIds[i] && s.collectionId === collectionId);
    if (index !== -1) {
      data.songs[index].order = i + 1;
    }
  }
  await writeDb(data);
  return true;
}
