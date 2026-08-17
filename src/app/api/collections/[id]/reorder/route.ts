import type { NextRequest } from "next/server";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/collections/[id]/reorder'>) {
  const { id } = await ctx.params;
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { songIds } = body;

  if (!Array.isArray(songIds) || songIds.length === 0) {
    return Response.json({ error: "songIds is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        user_id: userId,
        collection_id: parseInt(id, 10),
        song_ids: songIds.map((id: string) => parseInt(id, 10)),
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message || "Reorder failed" }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
