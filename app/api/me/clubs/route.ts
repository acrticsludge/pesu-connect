import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Club from "@/lib/models/Club";

export async function GET() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json([], { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json([], { status: 401 });
  }

  await connectDB();

  const clubs = await Club.find().lean();

  if (user.role === "admin") {
    return NextResponse.json(
      clubs.map((club: any) => ({
        _id: club._id.toString(),
        name: club.name,
        domains: club.domains.map((d: any) => ({ name: d.name })),
      })),
    );
  }

  const allowedClubs = clubs
    .map((club: any) => {
      const isClubHead = club.clubLeads.some((l: any) => l.srn === user.srn);

      const allowedDomains = club.domains.filter((d: any) =>
        d.domainLeads.some((l: any) => l.srn === user.srn),
      );

      if (!isClubHead && allowedDomains.length === 0) return null;

      return {
        _id: club._id.toString(),
        name: club.name,
        domains: isClubHead
          ? club.domains.map((d: any) => ({ name: d.name }))
          : allowedDomains.map((d: any) => ({ name: d.name })),
      };
    })
    .filter(Boolean);

  return NextResponse.json(allowedClubs);
}
