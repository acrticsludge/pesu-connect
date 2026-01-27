import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  await connectDB();

  const club = await Club.findById(id).lean();
  if (!club) return NextResponse.json(null, { status: 404 });

  club.domains = (club.domains ?? []).map((d: any) => {
    const ranks = d.ranks ?? [];
    const members = d.members ?? [];

    if (ranks.length === 0) {
      return { ...d, domainLeads: [], members };
    }

    const sortedRanks = [...ranks].sort((a: any, b: any) => a.level - b.level);

    const lowestRankName = sortedRanks[sortedRanks.length - 1].name;

    const domainLeads = members.filter((m: any) => m.rank !== lowestRankName);

    const normalMembers = members.filter((m: any) => m.rank === lowestRankName);

    return {
      ...d,
      domainLeads,
      members: normalMembers,
      ranks,
    };
  });

  return NextResponse.json({
    ...club,
    domains: club.domains.map((d: any) => ({
      ...d,
      domainLeads: d.domainLeads ?? [],
      members: d.members ?? [],
      ranks: d.ranks ?? [],
    })),
  });
}
