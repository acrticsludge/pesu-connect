import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import {
  validateRegistration,
  validateEventDates,
} from "@/lib/validators/event";

export async function POST(req: Request) {
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
  const { registration, startDate, endDate } = body;

  validateRegistration(registration);
  validateEventDates(new Date(startDate), new Date(endDate));

  const event = await Event.create({
    ...body,
    createdBy: user._id,
  });

  return NextResponse.json({ _id: event._id }, { status: 201 });
}
