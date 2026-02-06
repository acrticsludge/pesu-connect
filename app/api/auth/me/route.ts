import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return NextResponse.json({ user: null });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ user: null });

  await connectDB();

  const user = await User.findById(payload.sub).select("name srn email role");
  if (!user) return NextResponse.json({ user: null });

  return NextResponse.json({
    user: {
      name: user.name,
      srn: user.srn,
      email: user.email,
      role: user.role,
    },
  });
}
