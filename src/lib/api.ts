// Base URL for external API
// Set via environment variable NEXT_PUBLIC_API_URL
// Example: https://your-backend.com/api
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

interface FetchOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============ Auth ============

export async function apiLogin(username: string, password: string) {
  return apiFetch<{ token: string; username: string }>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
}

export async function apiVerifyToken(token: string) {
  return apiFetch<{ valid: boolean }>("/auth/verify", {
    method: "POST",
    body: { token },
  });
}

// ============ Collections ============

export async function apiGetCollections() {
  return apiFetch<import("./types").Collection[]>("/collections");
}

export async function apiGetCollection(id: string) {
  return apiFetch<import("./types").Collection>(`/collections/${id}`);
}

export async function apiCreateCollection(name: string, description: string) {
  return apiFetch<import("./types").Collection>("/collections", {
    method: "POST",
    body: { name, description },
  });
}

export async function apiUpdateCollection(id: string, name: string, description: string) {
  return apiFetch<import("./types").Collection>(`/collections/${id}`, {
    method: "PUT",
    body: { name, description },
  });
}

export async function apiDeleteCollection(id: string) {
  return apiFetch<{ success: boolean }>(`/collections/${id}`, { method: "DELETE" });
}

// ============ Songs ============

export async function apiGetSongsByCollection(collectionId: string) {
  return apiFetch<import("./types").Song[]>(`/collections/${collectionId}/songs`);
}

export async function apiGetSong(id: string) {
  return apiFetch<import("./types").Song>(`/songs/${id}`);
}

export async function apiCreateSong(collectionId: string, data: { title: string; artist: string; content: string; originalKey: string }) {
  return apiFetch<import("./types").Song>(`/collections/${collectionId}/songs`, {
    method: "POST",
    body: data,
  });
}

export async function apiUpdateSong(id: string, data: { title: string; artist: string; content: string; originalKey: string }) {
  return apiFetch<import("./types").Song>(`/songs/${id}`, {
    method: "PUT",
    body: data,
  });
}

export async function apiDeleteSong(id: string) {
  return apiFetch<{ success: boolean }>(`/songs/${id}`, { method: "DELETE" });
}

export async function apiReorderSongs(collectionId: string, songIds: string[]) {
  return apiFetch<{ success: boolean }>(`/collections/${collectionId}/reorder`, {
    method: "PUT",
    body: { songIds },
  });
}

// ============ Share ============

export async function apiGetSharedCollection(shareId: string) {
  return apiFetch<{ collection: import("./types").Collection; songs: import("./types").Song[] }>(`/share/${shareId}`);
}
