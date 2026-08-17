import type { NextRequest } from "next/server";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function GET(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
  const { id } = await ctx.params;
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json([]);
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/GetSong`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        user_id: userId,
        collection_id: parseInt(id, 10),
        page: 1,
        row_page: 200,
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json([]);
    }

    const songs = Array.isArray(data.result) ? data.result : [];
    const mapped = songs.map((song: { id: number; collection_id: number; title: string; artist: string; chord_content: string; original_key: string; song_order: number; tgl_input: string; tgl_update: string }) => ({
      id: String(song.id),
      collectionId: String(song.collection_id || id),
      title: song.title,
      artist: song.artist || "",
      content: song.chord_content,
      originalKey: song.original_key || "C",
      order: song.song_order || 0,
      createdAt: song.tgl_input || "",
      updatedAt: song.tgl_update || "",
    }));

    return Response.json(mapped);
  } catch (error) {
    console.error("Get songs error:", error);
    return Response.json([]);
  }
}

export async function POST(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/songs'>) {
  const { id } = await ctx.params;
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, artist, content, originalKey } = body;

  if (!title) {
    return Response.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/SaveSong`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "INSERT",
        token,
        user_id: userId,
        collection_id: parseInt(id, 10),
        title,
        artist: artist || "",
        chord_content: content || "",
        original_key: originalKey || "C",
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message }, { status: 400 });
    }

    const songId = data.result?.song_id || "0";

    return Response.json(
      {
        id: songId,
        collectionId: id,
        title,
        artist: artist || "",
        content: content || "",
        originalKey: originalKey || "C",
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create song error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
