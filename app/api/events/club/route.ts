import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";
import Event from "@/lib/models/Event";
import { isClubHead } from "@/lib/permissions";

export async function POST(req: Request) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = verifyToken(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { clubId, title, description } = await req.json();
  const club = await Club.findById(clubId).lean();

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  if (user.role !== "admin" && !isClubHead(club, user.srn)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Event.create({
    title,
    description,
    scope: "club",
    scopeId: club._id,
    createdBy: user.srn,
  });

  return NextResponse.json({ success: true });
}
