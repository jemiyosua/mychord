import { goGetSongs, type SongResult } from "@/lib/go-api";
import type { NextRequest } from "next/server";

// Share route - returns songs for public viewing without auth
// Note: This is a simplified version since share requires a public token mechanism

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/share/[shareId]'>) {
  const { shareId } = await ctx.params;

  // For now, return a placeholder collection with empty songs
  // In production, implement a public share token in the Go API
  const collection = {
    id: "shared",
    name: "Shared Collection",
    description: "",
    shareId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return Response.json({ collection, songs: [] });
}
