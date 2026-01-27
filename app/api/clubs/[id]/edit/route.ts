import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

function hasDuplicateLevels(ranks: any[]) {
  const levels = ranks.map((r) => r.level);
  return new Set(levels).size !== levels.length;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const data = await req.json();

  if (hasDuplicateLevels(data.ranks ?? [])) {
    return NextResponse.json(
      { error: "Duplicate club rank levels are not allowed" },
      { status: 400 },
    );
  }

  for (const d of data.domains ?? []) {
    if (hasDuplicateLevels(d.ranks ?? [])) {
      return NextResponse.json(
        {
          error: `Duplicate rank levels in domain "${d.name}" are not allowed`,
        },
        { status: 400 },
      );
    }
  }

  await Club.findByIdAndUpdate(id, data);
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  await connectDB();
  await Club.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
