import { initializeDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initializeDatabase();
    return Response.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    return Response.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
