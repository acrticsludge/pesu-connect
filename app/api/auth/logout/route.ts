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
  return response;
}

// Add this GET endpoint to check cookie status
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  return NextResponse.json({
    hasToken: !!token,
    tokenValue: token?.value || null,
  });
}
