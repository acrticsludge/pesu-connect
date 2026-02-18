import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Announcement from "@/lib/models/Announcement";
import User from "@/lib/models/User";
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: {
    POST: 20,
  },
});

export async function GET() {
  try {
    await connectDB();

    const announcements = await Announcement.find({
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json(
      { announcements },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimiter.check(
      `announcement-${payload.sub}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many announcements. Please try again later." },
        { status: 429 },
      );
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const announcement = await Announcement.create({
      ...body,
      createdBy: {
        _id: user._id,
        name: user.name,
        srn: user.srn,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 },
    );
  }
}
