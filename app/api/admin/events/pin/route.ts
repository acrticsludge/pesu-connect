import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Event from "@/lib/models/Event";

export async function PATCH(req: Request) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await req.json();
  if (!eventId) {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  await connectDB();

  const event = await Event.findById(eventId);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  event.pinned = !event.pinned;
  await event.save();

  return NextResponse.json({ success: true, pinned: event.pinned });
}
