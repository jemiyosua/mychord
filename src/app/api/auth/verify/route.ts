export async function POST(request: Request) {
  const body = await request.json();
  const { token } = body;

  // Token validation is handled by the Go API on each request.
  // Here we just check that a token string exists.
  if (!token || token.trim() === "") {
    return Response.json({ valid: false }, { status: 401 });
  }

  return Response.json({ valid: true });
}
