import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";

import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";

import {
  validateRegistration,
  validateEventDates,
} from "@/lib/validators/event";

function isUserClubHead(userSrn: string, club: any) {
  const maxLevel = Math.max(...club.ranks.map((r: any) => r.level));
  const topRanks = club.ranks.filter((r: any) => r.level === maxLevel);

  return topRanks.some((rank: any) =>
    rank.users.some((u: any) => u.srn === userSrn),
  );
}

async function canUserEditEvent(user: any, event: any) {
  if (user.role === "ADMIN") return true;

  for (const entry of event.involvedClubs) {
    const club = await Club.findById(entry.club);
    if (!club) continue;

    if (isUserClubHead(user.srn, club)) return true;
  }

  return false;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  await connectDB();

  const event = await Event.findById(params.id)
    .populate("involvedClubs.club", "name banner")
    .select("-__v");

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
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

    const event = await Event.findById(params.id);
    if (!event)
      return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const allowed = await canUserEditEvent(user, event);
    if (!allowed)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const updates = await req.json();

    if (updates.isPinned !== undefined && user.role !== "ADMIN") {
      delete updates.isPinned;
    }

    if (updates.registration) {
      validateRegistration(updates.registration);
    }

    if (updates.startDate && updates.endDate) {
      validateEventDates(
        new Date(updates.startDate),
        new Date(updates.endDate),
      );
    }

    const updatedEvent = await Event.findByIdAndUpdate(params.id, updates, {
      new: true,
    });

    return NextResponse.json({ event: updatedEvent });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update event" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const user = await User.findById(payload.sub);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await Event.findByIdAndDelete(params.id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
