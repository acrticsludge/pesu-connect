"use client";

import { useRouter } from "next/navigation";

type ActionBtnProps = {
  label: string;
  onClick?: () => void;
};

function ActionBtn({ label, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow cursor-pointer"
    >
      {label}
    </button>
  );
}

function AdminBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-shadow cursor-pointer"
    >
      {label}
    </button>
  );
}

export default function DashboardClient({
  user,
  memberClubs,
  leadClubs,
  leadDomains,
}: any) {
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <section className="rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Your Details</h2>
        <p className="text-[#A3A3A3]">
          <b className="text-white">Name:</b> {user.name}
        </p>
        <p className="text-[#A3A3A3]">
          <b className="text-white">Email:</b> {user.email}
        </p>
        <p className="text-[#A3A3A3]">
          <b className="text-white">SRN:</b> {user.srn}
        </p>
        <p className="text-[#A3A3A3]">
          <b className="text-white">Role:</b> {user.role}
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Your Clubs</h2>
        {memberClubs.length === 0 ? (
          <p className="text-sm text-[#A3A3A3]">
            You are not part of any clubs yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {memberClubs.map((club: any) => (
              <li
                key={club._id}
                className="border border-white/10 rounded-lg p-3 bg-[#0A0A0A] text-white"
              >
                {club.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      {user.role === "admin" && (
        <section className="rounded-xl border border-red-500/30 bg-red-900/20 p-6">
          <h2 className="text-lg font-semibold text-red-300 mb-4">
            Admin Controls
          </h2>
          <div className="flex gap-3 flex-wrap">
            <AdminBtn label="Manage Users" />
            <AdminBtn label="Manage Clubs" />
            <AdminBtn
              label="Manage Events (Pin / Delete)"
              onClick={() => router.push("/admin/events")}
            />
          </div>
        </section>
      )}

      {leadClubs.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Club Lead</h2>
          {leadClubs.map((club: any) => (
            <div
              key={club._id}
              className="border border-white/10 rounded-lg p-4 mb-3 bg-[#0A0A0A]"
            >
              <p className="font-medium text-white">{club.name}</p>
              <div className="flex gap-2 mt-2">
                <ActionBtn
                  label="Create Event"
                  onClick={() =>
                    router.push(`/events/create?type=club&clubId=${club._id}`)
                  }
                />
                <ActionBtn label="Manage Members" />
              </div>
            </div>
          ))}
        </section>
      )}

      {leadDomains.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-[#0A0A0A]/50 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Domain Lead</h2>
          {leadDomains.map((domain: any, i: number) => (
            <div
              key={i}
              className="border border-white/10 rounded-lg p-4 mb-3 bg-[#0A0A0A]"
            >
              <p className="font-medium text-white">
                {domain.name}{" "}
                <span className="text-sm text-[#A3A3A3]">
                  ({domain.clubName})
                </span>
              </p>
              <div className="flex gap-2 mt-2">
                <ActionBtn
                  label="Create Event"
                  onClick={() =>
                    router.push(
                      `/events/create?type=domain&clubId=${domain.clubId}&domain=${domain.name}`,
                    )
                  }
                />
                <ActionBtn label="Manage Roles" />
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
