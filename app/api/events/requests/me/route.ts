import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import EventCreationRequest from "@/lib/models/EventCreationRequest";

export async function GET() {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ requests: [] });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ requests: [] });
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return NextResponse.json({ requests: [] });
    }

    const requests = await EventCreationRequest.find({
      "requestedBy.srn": user.srn,
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching event requests:", error);
    return NextResponse.json({ requests: [] });
  }
}
