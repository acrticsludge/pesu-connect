import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Club from "@/lib/models/Club";
import User from "@/lib/models/User";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  await connectDB();

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload) redirect("/login");

  const user = await User.findOne({ srn: payload.srn }).lean();
  if (!user) redirect("/login");

  const clubs = await Club.find().lean();

  const memberClubs = clubs.filter(
    (club: any) =>
      club.clubLeads.some((m: any) => m.srn === user.srn) ||
      club.domains.some((d: any) =>
        d.members.some((m: any) => m.srn === user.srn),
      ),
  );

  const leadClubs = clubs.filter((club: any) =>
    club.clubLeads.some((l: any) => l.srn === user.srn),
  );

  const leadDomains = clubs.flatMap((club: any) =>
    club.domains
      .filter((d: any) => d.domainLeads.some((l: any) => l.srn === user.srn))
      .map((d: any) => ({ ...d, clubName: club.name })),
  );

  const safeUser = {
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };

  const safeMemberClubs = memberClubs.map((club: any) => ({
    ...club,
    _id: club._id.toString(),
  }));

  const safeLeadClubs = leadClubs.map((club: any) => ({
    ...club,
    _id: club._id.toString(),
  }));

  const safeLeadDomains = leadDomains.map((domain: any) => ({
    ...domain,
  }));

  return (
    <DashboardClient
      user={safeUser}
      memberClubs={safeMemberClubs}
      leadClubs={safeLeadClubs}
      leadDomains={safeLeadDomains}
    />
  );
}
