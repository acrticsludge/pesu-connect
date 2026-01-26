import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await connectDB();

  const club = await Club.findById(id);

  if (!club) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(club);
}
