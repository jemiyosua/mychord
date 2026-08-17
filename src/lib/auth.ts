// Default admin credentials
// In production, use environment variables or a proper auth system
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function validateCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function generateToken(username: string): string {
  // Simple token: base64 of username + timestamp
  const payload = JSON.stringify({ username, exp: Date.now() + 24 * 60 * 60 * 1000 }); // 24 hours
  return Buffer.from(payload).toString("base64");
}

export function verifyToken(token: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}
