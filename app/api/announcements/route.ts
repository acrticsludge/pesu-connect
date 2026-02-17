import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Announcement from "@/lib/models/Announcement";
import User from "@/lib/models/User";

export async function GET() {
  try {
    await connectDB();

    const announcements = await Announcement.find({
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }],
    })
      .sort({ pinned: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ announcements });
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
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.sub);
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
