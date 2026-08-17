import { getCollections, createCollection } from '@/lib/db';

export async function GET() {
  const collections = await getCollections();
  return Response.json(collections);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, description } = body;

  if (!name) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const collection = await createCollection(name, description || '');
  return Response.json(collection, { status: 201 });
}
