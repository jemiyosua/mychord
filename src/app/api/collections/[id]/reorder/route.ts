import type { NextRequest } from "next/server";

// Reorder is no longer needed since song ordering is managed by the Go API.
// This endpoint is kept for UI compatibility.

export async function PUT(req: NextRequest) {
  return Response.json({ success: true });
}
