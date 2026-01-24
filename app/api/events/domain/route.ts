import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Club from "@/lib/models/Club";
import Event from "@/lib/models/Event";

export async function POST(req: Request) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clubId, domainName, title, description } = await req.json();
  if (!clubId || !domainName || !title) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  await connectDB();

  const club = await Club.findById(clubId).lean();
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const domain = club.domains.find((d: { name: any }) => d.name === domainName);
  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const isDomainHead = domain.domainLeads.some(
    (l: { srn: string }) => l.srn === user.srn,
  );

  if (user.role !== "admin" && !isDomainHead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await Event.create({
    title,
    description,
    scope: "domain",
    scopeId: domain.name,
    clubId: club._id,
    createdBy: user.srn,
    pinned: false,
  });

  return NextResponse.json({ success: true });
}
