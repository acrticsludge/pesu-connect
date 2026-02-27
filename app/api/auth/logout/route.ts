import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("CDN-Cache-Control", "no-store");
  response.headers.set("Vercel-CDN-Cache-Control", "no-store");
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  return NextResponse.json({
    hasToken: !!token,
    tokenValue: token?.value || null,
  });
}
