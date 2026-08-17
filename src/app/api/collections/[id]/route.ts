import type { NextRequest } from "next/server";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function GET(req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all collections and find the one with matching ID
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

    if (data.error_code !== "0" || !Array.isArray(data.result)) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }

    const col = data.result.find((c: { id: number }) => String(c.id) === id);
    if (!col) {
      return Response.json({ error: "Collection not found" }, { status: 404 });
    }

    return Response.json({
      id: String(col.id),
      name: col.name,
      description: col.description || "",
      shareId: col.share_id,
      createdAt: col.tgl_input || "",
      updatedAt: col.tgl_update || "",
    });
  } catch (error) {
    console.error("Get collection error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
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
        method: "UPDATE",
        token,
        user_id: userId,
        collection_id: parseInt(id, 10),
        name,
        description: description || "",
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message || "Update failed" }, { status: 400 });
    }

    const col = data.result;
    return Response.json({
      id: String(col.id),
      name: col.name,
      description: col.description || "",
      shareId: col.share_id,
      createdAt: col.tgl_input || "",
      updatedAt: col.tgl_update || "",
    });
  } catch (error) {
    console.error("Update collection error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const token = req.headers.get("X-Auth-Token") || "";
  const userId = parseInt(req.headers.get("X-User-Id") || "0", 10);

  if (!token || !userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        method: "DELETE",
        token,
        user_id: userId,
        collection_id: parseInt(id, 10),
      }),
    });

    const data = await res.json();

    if (data.error_code !== "0") {
      return Response.json({ error: data.error_message || "Delete failed" }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete collection error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
