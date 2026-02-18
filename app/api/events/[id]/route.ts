import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";
import { RateLimiter } from "@/lib/rateLimiter";
import { LRUCache } from "lru-cache";

const eventCache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5,
});

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: {
    GET: 100,
    PATCH: 20,
    DELETE: 10,
  },
});

function isUserClubHead(userSrn: string, club: any) {
  if (!club?.ranks?.length) return false;
  const maxLevel = Math.max(...club.ranks.map((r: any) => r.level));
  const topRanks = club.ranks.filter((r: any) => r.level === maxLevel);
  return topRanks.some((rank: any) =>
    rank.users?.some((u: any) => u.srn === userSrn),
  );
}

async function canUserEditEvent(user: any, event: any) {
  if (user.role === "admin") return true;
  if (!event?.involvedClubs?.length) return false;

  for (const entry of event.involvedClubs) {
    if (!entry.club) continue;
    const club = await Club.findById(entry.club).lean();
    if (club && isUserClubHead(user.srn, club)) return true;
  }
  return false;
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

    const cached = eventCache.get(id);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Cache": "HIT",
        },
      });
    }

    await connectDB();

    const event = await Event.findById(id)
      .populate("involvedClubs.club", "name banner domains")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    eventCache.set(id, { event });

    return NextResponse.json(
      { event },
      {
        headers: {
          "Cache-Control": "private, max-age=300",
          "X-Cache": "MISS",
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

    eventCache.delete(id);

    return NextResponse.json(
      { event: updatedEvent },
      {
        headers: {
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

    eventCache.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 },
    );
  }
}
