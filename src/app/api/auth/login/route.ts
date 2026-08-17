import { goLogin } from "@/lib/go-api";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return Response.json({ error: "Username dan password wajib diisi" }, { status: 400 });
  }

  try {
    const result = await goLogin(username, password);

    if (result.error_code !== "0") {
      return Response.json({ error: result.error_message || "Login gagal" }, { status: 401 });
    }

    // Return token and user info
    return Response.json({
      token: result.result.token,
      username: result.result.username,
      user_id: result.result.id,
      nama_lengkap: result.result.nama_lengkap,
    });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
