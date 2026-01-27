import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

function hasDuplicateLevels(ranks: any[]) {
  const levels = ranks.map((r) => r.level);
  return new Set(levels).size !== levels.length;
}

function hasDuplicateUsers(ranks: any[]) {
  const seen = new Set<string>();

  for (const r of ranks ?? []) {
    for (const u of r.users ?? []) {
      if (seen.has(u.srn)) return true;
      seen.add(u.srn);
    }
  }

  return false;
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const data = await req.json();

  await connectDB();

  if (hasDuplicateLevels(data.ranks ?? [])) {
    return NextResponse.json(
      { error: "Duplicate club rank levels are not allowed" },
      { status: 400 },
    );
  }

  if (hasDuplicateUsers(data.ranks ?? [])) {
    return NextResponse.json(
      { error: "A user cannot have multiple club ranks" },
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

    const domainSeen = new Set<string>();
    for (const m of d.members ?? []) {
      if (domainSeen.has(m.srn)) {
        return NextResponse.json(
          {
            error: `User ${m.srn} has multiple ranks in domain "${d.name}"`,
          },
          { status: 400 },
        );
      }
      domainSeen.add(m.srn);
    }
  }

  await Club.findByIdAndUpdate(id, data, { new: true });

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
