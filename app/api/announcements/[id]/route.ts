import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Announcement from "@/lib/models/Announcement";
import User from "@/lib/models/User";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    const body = await req.json();

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true },
    );

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ announcement });
  } catch (error) {
    console.error("Error updating announcement:", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;
    await Announcement.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 },
    );
  }
}
