// app/api/whoami/route.js
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sub: id, name, email, role } = token;

  return new Response(
    JSON.stringify({ id, name, email, role }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
