import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const data = await req.json();

  const clubLeadRank = data.ranks?.find((r: any) => r.level === 1);

  const syncedClubLeads = (data.clubLeads ?? []).map((l: any) => ({
    ...l,
    rank: clubLeadRank ? clubLeadRank.name : l.rank,
  }));

  const syncedDomains = (data.domains ?? []).map((domain: any) => {
    const leadRank = domain.ranks?.find((r: any) => r.level === 1);

    if (!leadRank) return domain;

    const domainLeads = (domain.domainLeads ?? []).map((l: any) => ({
      ...l,
      rank: leadRank.name,
    }));

    const leadSrns = new Set(domainLeads.map((l: any) => l.srn));

    const members = (domain.members ?? []).filter(
      (m: any) => !leadSrns.has(m.srn),
    );

    return {
      ...domain,
      domainLeads,
      members,
    };
  });

  const updated = await Club.findByIdAndUpdate(
    id,
    {
      ...data,
      clubLeads: syncedClubLeads,
      domains: syncedDomains,
    },
    { new: true },
  );

  if (!updated) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
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
