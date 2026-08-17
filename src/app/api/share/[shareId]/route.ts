import type { NextRequest } from "next/server";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/share/[shareId]'>) {
  const { shareId } = await ctx.params;

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Share/${shareId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message || "Collection not found" }, { status: 404 });
    }

    // Map Go API response to frontend format
    const collection = {
      id: String(data.collection?.id || ""),
      name: data.collection?.name || "",
      description: data.collection?.description || "",
      shareId: data.collection?.share_id || shareId,
      createdAt: data.collection?.tgl_input || "",
      updatedAt: data.collection?.tgl_update || "",
    };

    const songs = Array.isArray(data.songs)
      ? data.songs.map((song: { id: number; title: string; artist: string; chord_content: string; original_key: string; reference_link: string; song_order: number }) => ({
          id: String(song.id),
          collectionId: collection.id,
          title: song.title || "",
          artist: song.artist || "",
          content: song.chord_content || "",
          originalKey: song.original_key || "C",
          referenceLink: song.reference_link || "",
          order: song.song_order || 0,
          createdAt: "",
          updatedAt: "",
        }))
      : [];

    return Response.json({ collection, songs });
  } catch (error) {
    console.error("Share fetch error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
