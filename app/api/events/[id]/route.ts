import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: {
    GET: 100,
    PATCH: 20,
    DELETE: 10,
  },
});

async function canUserEditEvent(user: any, event: any) {
  if (user.role === "admin") return true;
  if (!event?.involvedClubs?.length) return false;

  const clubIds = event.involvedClubs.map((entry: any) => entry.club);

  const clubs = await Club.find({
    _id: { $in: clubIds },
    ranks: {
      $elemMatch: {
        level: 1,
        "users.srn": user.srn,
      },
    },
  }).lean();

  return clubs.length > 0;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    const payload = token ? verifyToken(token) : null;
    const userId = payload?.sub;

    const rateLimitResult = await rateLimiter.check(
      `event-get-${userId || "anon"}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    await connectDB();

    const event = await Event.findById(id)
      .populate("involvedClubs.club", "name banner domains")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(
      { event },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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

    const rateLimitResult = await rateLimiter.check(
      `event-patch-${payload.sub}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many update requests" },
        { status: 429 },
      );
    }

    await connectDB();

    const [user, { id }] = await Promise.all([
      User.findById(payload.sub).lean(),
      params,
    ]);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const allowed = await canUserEditEvent(user, event);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates = await req.json();

    if (updates.isPinned !== undefined && user.role !== "admin") {
      delete updates.isPinned;
    }

    if (updates.registration?.isRegister && !updates.registration.deadline) {
      return NextResponse.json(
        {
          error:
            "Registration deadline is required when registration is enabled",
        },
        { status: 400 },
      );
    }

    if (updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate);
      const end = new Date(updates.endDate);
      if (start >= end) {
        return NextResponse.json(
          { error: "End date must be after start date" },
          { status: 400 },
        );
      }
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    ).populate("involvedClubs.club", "name banner");

    return NextResponse.json(
      { event: updatedEvent },
      {
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      },
    );
  } catch (err: any) {
    console.error("Error updating event:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update event" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
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

    const rateLimitResult = await rateLimiter.check(
      `event-delete-${payload.sub}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many delete requests" },
        { status: 429 },
      );
    }

    await connectDB();

    const [user, { id }] = await Promise.all([
      User.findById(payload.sub).lean(),
      params,
    ]);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await Event.findByIdAndDelete(id).lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
