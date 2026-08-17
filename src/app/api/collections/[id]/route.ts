import type { NextRequest } from "next/server";

// Collections are no longer stored in a local database.
// Returns a default collection for UI compatibility.

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;

  return Response.json({
    id,
    name: "My Songs",
    description: "Koleksi lagu saya",
    shareId: "mychord",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, description } = body;

  return Response.json({
    id,
    name: name || "My Songs",
    description: description || "",
    shareId: "mychord",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function DELETE(_req: NextRequest) {
  return Response.json({ success: true });
}
