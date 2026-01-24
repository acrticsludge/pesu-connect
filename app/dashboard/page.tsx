import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Club from "@/lib/models/Club";
import User from "@/lib/models/User";

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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Your Details</h2>
        <p>
          <b>Name:</b> {user.name}
        </p>
        <p>
          <b>Email:</b> {user.email}
        </p>
        <p>
          <b>SRN:</b> {user.srn}
        </p>
        <p>
          <b>Role:</b> {user.role}
        </p>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Your Clubs</h2>
        {memberClubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You are not part of any clubs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {memberClubs.map((club) => (
              <li key={club._id} className="border rounded p-3">
                {club.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {user.role === "admin" && (
        <section className="rounded-xl border border-red-300 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-700 mb-4">
            Admin Controls
          </h2>
          <div className="flex gap-3 flex-wrap">
            <AdminBtn label="Manage Users" />
            <AdminBtn label="Manage Clubs" />
            <AdminBtn label="Manage Events" />
          </div>
        </section>
      )}

      {leadClubs.length > 0 && (
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Club Lead</h2>
          {leadClubs.map((club) => (
            <div key={club._id} className="border rounded p-4 mb-3">
              <p className="font-medium">{club.name}</p>
              <div className="flex gap-2 mt-2">
                <ActionBtn label="Create Event" />
                <ActionBtn label="Manage Members" />
              </div>
            </div>
          ))}
        </section>
      )}

      {leadDomains.length > 0 && (
        <section className="rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Domain Lead</h2>
          {leadDomains.map((domain, i) => (
            <div key={i} className="border rounded p-4 mb-3">
              <p className="font-medium">
                {domain.name}
                <span className="text-sm text-muted-foreground">
                  {" "}
                  ({domain.clubName})
                </span>
              </p>
              <div className="flex gap-2 mt-2">
                <ActionBtn label="Create Event" />
                <ActionBtn label="Manage Roles" />
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function AdminBtn({ label }: { label: string }) {
  return (
    <button className="border px-4 py-2 rounded hover:bg-red-100">
      {label}
    </button>
  );
}

function ActionBtn({ label }: { label: string }) {
  return (
    <button className="border px-3 py-1.5 rounded hover:bg-muted">
      {label}
    </button>
  );
}
