import { validateCredentials, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return Response.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  if (!validateCredentials(username, password)) {
    return Response.json({ error: "Username atau password salah" }, { status: 401 });
  }

  const token = generateToken(username);

  return Response.json({ token, username });
}
