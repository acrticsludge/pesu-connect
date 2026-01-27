"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { Club } from "@/lib/types/club";
import Link from "next/dist/client/link";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

export default function ClubDomainPage() {
  const { id, domain } = useParams<{ id: string; domain: string }>();

  const [club, setClub] = useState<Club | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/clubs/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setClub)
      .catch(() => setClub(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!club) return;

    const srns = new Set<string>();

    club.domains.forEach((d) => {
      d.domainLeads.forEach((m) => srns.add(m.srn));
      d.members.forEach((m) => srns.add(m.srn));
    });

    if (srns.size === 0) return;

    fetch("/api/users/by-srn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srns: Array.from(srns) }),
    })
      .then((res) => res.json())
      .then((users) => {
        const map: Record<string, string> = {};
        users.forEach((u: { srn: string; name: string }) => {
          map[u.srn] = u.name;
        });
        setUserMap(map);
      });
  }, [club]);

  if (loading) {
    return (
      <div className="text-center text-[#A3A3A3] py-20">Loading domain...</div>
    );
  }

  if (!club) {
    return notFound();
  }

  const activeDomain = club.domains.find((d) => slugify(d.name) === domain);

  if (!activeDomain) {
    return notFound();
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
        <Image
          src={club.banner?.url || "/placeholder-banner.png"}
          alt={club.banner?.alt || club.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <div className="space-y-2">
              <nav className="mb-4 text-sm text-[#A3A3A3]">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/clubs" className="hover:text-white">
                      Clubs
                    </Link>
                  </li>
                  <span>›</span>
                  <li>
                    <Link
                      href={`/clubs/${club._id}`}
                      className="hover:text-white"
                    >
                      {club.name}
                    </Link>
                  </li>
                  <span>›</span>
                  <li className="text-white font-medium">
                    {activeDomain.name}
                  </li>
                </ol>
              </nav>

              <p className="text-sm text-purple-300">{club.name}</p>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                {activeDomain.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {activeDomain.description && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  About This Domain
                </h2>
                <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
                  {activeDomain.description}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Domain Ranks
              </h2>

              <div className="flex flex-wrap gap-2">
                {activeDomain.ranks.map((rank) => (
                  <span
                    key={rank.name}
                    className="px-3 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200"
                  >
                    {rank.name}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-3">
                Domain Leads
              </h2>

              <div className="space-y-2">
                {(activeDomain.domainLeads ?? []).map((lead) => (
                  <div key={lead.srn} className="flex justify-between text-sm">
                    <span className="text-white">
                      {userMap[lead.srn] ?? "Null User"}
                    </span>
                    <span className="text-[#A3A3A3]">{lead.rank}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-3">Members</h2>

              <div className="space-y-2">
                {activeDomain.members.map((member) => (
                  <div
                    key={member.srn}
                    className="flex justify-between text-sm opacity-90"
                  >
                    <span className="text-white">
                      {userMap[member.srn] ?? "Null User"}
                    </span>
                    <span className="text-[#A3A3A3]">{member.rank}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
