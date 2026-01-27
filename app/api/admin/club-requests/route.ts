import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import ClubCreationRequest from "@/lib/models/ClubCreationRequest";

export async function GET(req: Request) {
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

    const admin = await User.findById(payload.sub).select("role name");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";

    const requests = await ClubCreationRequest.find({ status })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("Fetch club requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
