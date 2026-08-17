// Go API base URL
const GO_API_BASE = process.env.GO_API_URL || "https://api.ipl-q.com/api/v1/web";

interface GoApiResponse<T = unknown> {
  error_code: string;
  error_message: string;
  datetime: string;
  total_page?: number;
  total_record?: number;
  result: T;
}

/**
 * Make a POST request to Go API
 */
export async function goApiFetch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<GoApiResponse<T>> {
  const bodyString = JSON.stringify(body);

  const res = await fetch(`${GO_API_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: bodyString,
  });

  if (!res.ok) {
    throw new Error(`Go API responded with status ${res.status}`);
  }

  const data: GoApiResponse<T> = await res.json();
  return data;
}

// ============ Login ============

export interface LoginResult {
  id: number;
  username: string;
  nama_lengkap: string;
  email: string;
  token: string;
}

export async function goLogin(username: string, password: string) {
  return goApiFetch<LoginResult>("/MyChord/Login", {
    username,
    password,
  });
}

// ============ Save Song (INSERT/UPDATE/DELETE) ============

export interface SaveSongResult {
  song_id: string;
}

export async function goSaveSong(params: {
  method: "INSERT" | "UPDATE" | "DELETE";
  token: string;
  user_id: number;
  song_id?: number;
  title?: string;
  artist?: string;
  chord_content?: string;
  original_key?: string;
  genre?: string;
}) {
  return goApiFetch<SaveSongResult>("/MyChord/SaveSong", params);
}

// ============ Get Songs ============

export interface SongResult {
  id: number;
  user_id: number;
  title: string;
  artist: string;
  chord_content: string;
  original_key: string;
  genre: string;
  tgl_input: string;
  tgl_update: string;
}

export async function goGetSongs(params: {
  token: string;
  user_id: number;
  song_id?: number;
  search?: string;
  page?: number;
  row_page?: number;
}) {
  return goApiFetch<SongResult[] | SongResult>("/MyChord/GetSong", params);
}
