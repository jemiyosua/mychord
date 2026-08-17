import { getCollectionById, updateCollection, deleteCollection } from '@/lib/db';
import type { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const collection = await getCollectionById(id);

  if (!collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  return Response.json(collection);
}

export async function PUT(req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, description } = body;

  if (!name) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const collection = await updateCollection(id, name, description || '');
  if (!collection) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  return Response.json(collection);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<'/api/collections/[id]'>) {
  const { id } = await ctx.params;
  const success = await deleteCollection(id);

  if (!success) {
    return Response.json({ error: 'Collection not found' }, { status: 404 });
  }

  return Response.json({ success: true });
}
