import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();

    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          name: user.name,
          srn: user.srn,
          email: user.email,
          role: user.role,
          profilePic: user.profilePic || null,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { user: null },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
