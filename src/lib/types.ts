export interface Collection {
  id: string;
  name: string;
  description: string;
  shareId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Song {
  id: string;
  collectionId: string;
  title: string;
  artist: string;
  content: string; // Lyrics with chord notations in brackets like [Am]Hello [C]World
  originalKey: string;
  referenceLink: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  collections: Collection[];
  songs: Song[];
}
