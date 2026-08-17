// Collections are no longer stored in a local database.
// A single default collection is returned so the UI remains functional.
// All song data is managed by the Go API backend.

const DEFAULT_COLLECTION = {
  id: "default",
  name: "My Songs",
  description: "Koleksi lagu saya",
  shareId: "mychord",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  return Response.json([DEFAULT_COLLECTION]);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  // Return as if created (data is managed by Go API for songs)
  return Response.json(
    {
      id: "default",
      name,
      description: description || "",
      shareId: "mychord",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    { status: 201 }
  );
}
