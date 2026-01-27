import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import ClubCreationRequest from "@/lib/models/ClubCreationRequest";

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) return NextResponse.json({ requests: [] });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ requests: [] });

    await connectDB();

    const user = await User.findById(payload.sub).select("_id role");
    if (!user) return NextResponse.json({ requests: [] });

    const requests = await ClubCreationRequest.find({
      "requestedBy.userId": user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (err) {
    console.error("Fetch my club requests error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
