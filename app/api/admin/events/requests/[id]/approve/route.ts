import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import EventCreationRequest from "@/lib/models/EventCreationRequest";
import Event from "@/lib/models/Event";

export async function POST(
  _: Request,
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

    const user = await User.findById(payload.sub).lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const request = await EventCreationRequest.findById(id);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Invalid or already handled request" },
        { status: 400 },
      );
    }

    if (!request.requestedBy?.userId) {
      return NextResponse.json(
        { error: "Request has no associated user" },
        { status: 400 },
      );
    }

    const event = await Event.create({
      ...request.eventData,
      createdBy: request.requestedBy.userId,
    });

    request.status = "completed";
    request.handledBy = {
      adminId: user._id,
      name: user.name,
    };

    await request.save();

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error approving event request:", error);
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 },
    );
  }
}
