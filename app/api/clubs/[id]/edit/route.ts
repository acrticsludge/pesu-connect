import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await connectDB();

  const data = await req.json();

  const club = await Club.findByIdAndUpdate(id, data, { new: true });

  if (!club) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(club);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  await connectDB();

  const club = await Club.findByIdAndDelete(id);
  if (!club) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
