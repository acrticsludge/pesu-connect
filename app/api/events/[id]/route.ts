import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";

function isUserClubHead(userSrn: string, club: any) {
  const maxLevel = Math.max(...club.ranks.map((r: any) => r.level));
  const topRanks = club.ranks.filter((r: any) => r.level === maxLevel);

  return topRanks.some((rank: any) =>
    rank.users.some((u: any) => u.srn === userSrn),
  );
}

async function canUserEditEvent(user: any, event: any) {
  if (user.role === "admin") return true;

  for (const entry of event.involvedClubs) {
    const club = await Club.findById(entry.club);
    if (!club) continue;

    if (isUserClubHead(user.srn, club)) return true;
  }

  return false;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await connectDB();

    const event = await Event.findById(id)
      .populate("involvedClubs.club", "name banner domains")
      .lean();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
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
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const user = await User.findById(payload.sub);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const event = await Event.findById(id);
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const allowed = await canUserEditEvent(user, event);
    if (!allowed)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates = await req.json();

    // Only admins can pin events
    if (updates.isPinned !== undefined && user.role !== "admin") {
      delete updates.isPinned;
    }

    // Validate registration if provided
    if (updates.registration) {
      if (updates.registration.isRegister && !updates.registration.deadline) {
        return NextResponse.json(
          {
            error:
              "Registration deadline is required when registration is enabled",
          },
          { status: 400 },
        );
      }
    }

    // Validate dates
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

    return NextResponse.json({ event: updatedEvent });
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
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const user = await User.findById(payload.sub);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const event = await Event.findByIdAndDelete(id);

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
