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
      if (!u?.srn) continue;
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

  // -------------------------
  // NORMALIZE CLUB RANKS
  // -------------------------
  const safeRanks = (data.ranks ?? []).map((r: any, i: number) => ({
    name: r?.name ?? "",
    level: typeof r?.level === "number" ? r.level : i + 1,
    users: Array.isArray(r?.users) ? r.users.filter((u: any) => u?.srn) : [],
  }));

  // -------------------------
  // NORMALIZE DOMAINS
  // -------------------------
  const safeDomains = (data.domains ?? []).map((d: any) => ({
    name: d?.name ?? "",
    description: d?.description ?? "",
    ranks: (d?.ranks ?? []).map((r: any, i: number) => ({
      name: r?.name ?? "",
      level: typeof r?.level === "number" ? r.level : i + 1,
      users: Array.isArray(r?.users) ? r.users.filter((u: any) => u?.srn) : [],
    })),
  }));

  // -------------------------
  // VALIDATION
  // -------------------------
  if (hasDuplicateLevels(safeRanks)) {
    return NextResponse.json(
      { error: "Duplicate club rank levels are not allowed" },
      { status: 400 },
    );
  }

  if (hasDuplicateUsers(safeRanks)) {
    return NextResponse.json(
      { error: "A user cannot have multiple club ranks" },
      { status: 400 },
    );
  }

  for (const d of safeDomains) {
    if (hasDuplicateLevels(d.ranks)) {
      return NextResponse.json(
        { error: `Duplicate rank levels in domain "${d.name}"` },
        { status: 400 },
      );
    }

    if (hasDuplicateUsers(d.ranks)) {
      return NextResponse.json(
        { error: `Duplicate users in domain "${d.name}"` },
        { status: 400 },
      );
    }
  }

  // -------------------------
  // UPDATE (FULL REPLACE)
  // -------------------------
  const updated = await Club.findByIdAndUpdate(
    id,
    {
      $set: {
        name: data.name,
        shortDescription: data.shortDescription ?? "",
        fullDescription: data.fullDescription ?? "",
        foundedOn: data.foundedOn,
        banner: data.banner ?? { url: "", alt: "" },
        instagram: data.instagram ?? "",
        isRecruiting: !!data.isRecruiting,
        recruitingLink: data.recruitingLink ?? "",
        staffCoordinator: data.staffCoordinator ?? {
          name: "",
          department: "",
        },
        ranks: safeRanks,
        domains: safeDomains,
      },
    },
    { runValidators: true, new: true },
  );

  if (!updated) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

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
