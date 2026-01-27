import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  console.log("API HIT with id:", id);

  await connectDB();

  const club = await Club.findById(id).lean();

  console.log("Club found?", !!club);

  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  return NextResponse.json(club);
}
