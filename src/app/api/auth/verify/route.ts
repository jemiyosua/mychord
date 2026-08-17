import { verifyToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { token } = body;

  if (!token || !verifyToken(token)) {
    return Response.json({ valid: false }, { status: 401 });
  }

  return Response.json({ valid: true });
}
