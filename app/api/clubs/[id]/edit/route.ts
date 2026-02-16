/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  getClubEditScope,
  getEditableDomainIndexes,
} from "@/lib/permissions/clubPermissions";
import Club from "@/lib/models/Club";
import User from "@/lib/models/User";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

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
  const token = (await cookies()).get("auth_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(payload.sub).select("name srn email role");
  const actualUser = user.user;

  const club = await Club.findById(id);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }
  const isSelfRemovingFromClubLevelOne =
    user.role !== "admin" &&
    (() => {
      if (!Array.isArray(data.ranks)) return false;

      const oldTopRank = club.ranks?.find((r: any) => r.level === 1);
      const newTopRank = data.ranks?.find((r: any) => r.level === 1);

      if (!oldTopRank || !newTopRank) return false;

      const wasUser = oldTopRank.users?.some((u: any) => u.srn === user.srn);

      const isUserNow = newTopRank.users?.some((u: any) => u.srn === user.srn);

      return wasUser && !isUserNow;
    })();

  const isSelfRemovingFromDomainLevelOne =
    user.role !== "admin" &&
    (() => {
      if (!Array.isArray(data.domains)) return false;

      return data.domains.some((d: any, di: number) => {
        const existingDomain = club.domains[di];
        if (!existingDomain) return false;

        return d.ranks?.some((r: any) => {
          if (r.level !== 1) return false;

          const wasUser = existingDomain.ranks
            ?.find((er: any) => er.level === 1)
            ?.users?.some((u: any) => u.srn === user.srn);

          const isUserNow = r.users?.some((u: any) => u.srn === user.srn);

          return wasUser && !isUserNow;
        });
      });
    })();

  const scope = getClubEditScope({ user, club });
  console.log(scope);

  if (
    scope === "NONE" &&
    !isSelfRemovingFromDomainLevelOne &&
    !isSelfRemovingFromClubLevelOne
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let incomingRanks = data.ranks;
  let incomingDomains = data.domains;

  if (scope === "DOMAIN") {
    incomingRanks = isSelfRemovingFromClubLevelOne ? data.ranks : club.ranks;

    const editableDomains = getEditableDomainIndexes({
      user: actualUser,
      club,
    });

    incomingDomains = club.domains.map((d: any, i: number) => {
      if (editableDomains.includes(i)) {
        return data.domains[i];
      }

      if (isSelfRemovingFromDomainLevelOne) {
        return data.domains[i] ?? d;
      }

      return d;
    });
  }

  const safeRanks = (incomingRanks ?? []).map((r: any, i: number) => ({
    name: r?.name ?? "",
    level: typeof r?.level === "number" ? r.level : i + 1,
    users: Array.isArray(r?.users) ? r.users.filter((u: any) => u?.srn) : [],
  }));

  const safeDomains = (incomingDomains ?? []).map((d: any) => ({
    name: d?.name ?? "",
    description: d?.description ?? "",
    ranks: (d?.ranks ?? []).map((r: any, i: number) => ({
      name: r?.name ?? "",
      level: typeof r?.level === "number" ? r.level : i + 1,
      users: Array.isArray(r?.users) ? r.users.filter((u: any) => u?.srn) : [],
    })),
  }));

  if (hasDuplicateLevels(safeRanks)) {
    return NextResponse.json(
      { error: "Duplicate club rank levels are not allowed" },
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
  }

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

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findById(payload.sub).select("srn role");
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  const club = await Club.findById(id);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const scope = getClubEditScope({ user, club });
  if (scope !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Club.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
