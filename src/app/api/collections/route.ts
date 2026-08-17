import type { NextRequest } from "next/server";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function GET(req: NextRequest) {
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json([]);
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "SELECT",
        token,
        user_id: userId,
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json([]);
    }

    const collections = Array.isArray(data.result)
      ? data.result.map((col: { id: number; name: string; description: string; share_id: string; tgl_input: string; tgl_update: string }) => ({
          id: String(col.id),
          name: col.name,
          description: col.description || "",
          shareId: col.share_id,
          createdAt: col.tgl_input || "",
          updatedAt: col.tgl_update || "",
        }))
      : [];

    return Response.json(collections);
  } catch (error) {
    console.error("Get collections error:", error);
    return Response.json([]);
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "INSERT",
        token,
        user_id: userId,
        name,
        description: description || "",
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message }, { status: 400 });
    }

    const col = data.result;
    return Response.json(
      {
        id: String(col.id),
        name: col.name,
        description: col.description || "",
        shareId: col.share_id,
        createdAt: col.tgl_input || new Date().toISOString(),
        updatedAt: col.tgl_update || "",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create collection error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
