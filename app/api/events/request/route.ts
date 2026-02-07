import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/lib/models/User";
import EventCreationRequest from "@/lib/models/EventCreationRequest";
import {
  validateInvolvedClubs,
  validateRegistration,
  validateEventDates,
} from "@/lib/validators/event";

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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admins must use direct event creation" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { involvedClubs, registration, startDate, endDate } = body;

    await validateInvolvedClubs(involvedClubs, user.srn);
    validateRegistration(registration);
    validateEventDates(new Date(startDate), new Date(endDate));

    const request = await EventCreationRequest.create({
      eventData: body,
      requestedBy: {
        userId: user._id,
        name: user.name,
        srn: user.srn,
        email: user.email,
      },
    });

    return NextResponse.json({ request }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Event creation failed" },
      { status: 400 },
    );
  }
}
