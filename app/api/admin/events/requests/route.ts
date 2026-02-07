import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/lib/models/User";
import EventCreationRequest from "@/lib/models/EventCreationRequest";

export async function GET() {
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

  const requests = await EventCreationRequest.find({ status: "pending" })
    .sort({ createdAt: -1 })
    .populate("requestedBy.userId", "name srn email");

  return NextResponse.json({ requests });
}
