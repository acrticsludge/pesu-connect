// app/api/auth/me/route.ts
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

  // Get the full user document - don't exclude any fields
  const user = await User.findById(payload.sub).lean();

  if (!user) return NextResponse.json({ user: null });

  console.log("Auth route - sending user:", {
    id: user._id,
    name: user.name,
    profilePic: user.profilePic,
  });

  return NextResponse.json({
    user: {
      _id: user._id,
      name: user.name,
      srn: user.srn,
      email: user.email,
      role: user.role,
      profilePic: user.profilePic || null,
    },
  });
}
