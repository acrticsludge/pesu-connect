import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import cloudinary from "@/lib/cloudinary";

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
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Check if user is admin
    const admin = await User.findById(payload.sub).lean();
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get target user
    const { id } = await params;
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete profile pic from cloudinary if it exists
    if (targetUser.profilePic) {
      try {
        const publicIdMatch = targetUser.profilePic.match(
          /profile-pics\/([^/.]+)/,
        );
        if (publicIdMatch) {
          await cloudinary.uploader.destroy(publicIdMatch[0]);
        }
      } catch (error) {
        console.error("Error deleting image from cloudinary:", error);
      }
    }

    // Clear profile pic from database
    targetUser.profilePic = null;
    await targetUser.save();

    return NextResponse.json({
      message: "Profile picture removed successfully",
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        srn: targetUser.srn,
        email: targetUser.email,
        role: targetUser.role,
        profilePic: null,
      },
    });
  } catch (error) {
    console.error("Error removing profile picture:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
