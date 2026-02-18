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
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 30,
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimiter.check(
      `event-create-${payload.sub}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many event creations. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { registration, startDate, endDate, name } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 },
      );
    }

    validateRegistration(registration);
    validateEventDates(new Date(startDate), new Date(endDate));

    const existingEvent = await Event.findOne({
      name: { $regex: `^${name}$`, $options: "i" },
      startDate: new Date(startDate),
    }).lean();

    if (existingEvent) {
      return NextResponse.json(
        { error: "Event with similar name and date already exists" },
        { status: 409 },
      );
    }

    const event = await Event.create({
      ...body,
      createdBy: user._id,
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        _id: event._id,
        message: "Event created successfully",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      },
    );
  } catch (err: any) {
    console.error("Event creation error:", err);
    return NextResponse.json(
      { error: err.message || "Event creation failed" },
      { status: 400 },
    );
  }
}
