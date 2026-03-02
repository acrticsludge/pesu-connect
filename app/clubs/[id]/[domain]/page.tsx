"use client";

import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Club, ClubDomain, DomainRank } from "@/lib/types/club";
import Link from "next/link";
import { useClub } from "@/lib/hooks/useClubs";
import { useDomainUserNames } from "@/lib/hooks/useDomainUserNames";

const FALLBACK_BANNER = "/placeholder-banner.png";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

export default function ClubDomainPage() {
  const { id, domain } = useParams<{ id: string; domain: string }>();
  const [expandedRanks, setExpandedRanks] = useState<Set<string>>(new Set());

  const { data: club, isLoading: clubLoading } = useClub(id);
  const { data: userMap = {} } = useDomainUserNames(club, domain);

  const toggleRankExpand = (rankKey: string) => {
    setExpandedRanks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rankKey)) {
        newSet.delete(rankKey);
      } else {
        newSet.add(rankKey);
      }
      return newSet;
    });
  };

  if (clubLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) {
    return notFound();
  }

  const activeDomain = (club.domains ?? []).find(
    (d: ClubDomain) => slugify(d.name) === domain,
  );

  if (!activeDomain) {
    return notFound();
  }

  const sortedRanks = [...(activeDomain.ranks ?? [])].sort(
    (a: DomainRank, b: DomainRank) => a.level - b.level,
  );

  const lowestLevel =
    sortedRanks.length > 0 ? sortedRanks[sortedRanks.length - 1].level : null;

  const leads = sortedRanks.filter(
    (r: DomainRank) => lowestLevel !== null && r.level < lowestLevel,
  );

  const members = sortedRanks.filter(
    (r: DomainRank) => lowestLevel !== null && r.level === lowestLevel,
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-48 sm:h-56 md:h-64 w-full overflow-hidden">
        <Image
          src={club.banner?.url || FALLBACK_BANNER}
          alt={club.banner?.alt || club.name}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6 w-full">
            <div className="space-y-1 sm:space-y-2">
              <nav className="mb-2 sm:mb-4 text-xs sm:text-sm text-[#A3A3A3]">
                <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
                  <li>
                    <Link href="/clubs" className="hover:text-white transition">
                      Clubs
                    </Link>
                  </li>
                  <span>›</span>
                  <li>
                    <Link
                      href={`/clubs/${club._id}`}
                      className="hover:text-white transition"
                    >
                      <span className="truncate max-w-24 sm:max-w-32 inline-block align-bottom">
                        {club.name}
                      </span>
                    </Link>
                  </li>
                  <span>›</span>
                  <li className="text-white font-medium truncate max-w-32 sm:max-w-48">
                    {activeDomain.name}
                  </li>
                </ol>
              </nav>

              <p className="text-xs sm:text-sm text-purple-300">{club.name}</p>
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-white wrap-break-word">
                {activeDomain.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-14">
        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.2fr_0.8fr] min-w-0">
          <div className="space-y-4 sm:space-y-6 min-w-0">
            {activeDomain.description && (
              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2">
                  About This Domain
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-[#A3A3A3] leading-relaxed break-words overflow-x-hidden">
                  {activeDomain.description}
                </p>
              </section>
            )}

            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">
                Domain Ranks
              </h2>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(activeDomain.ranks ?? []).map((rank: DomainRank) => (
                  <span
                    key={rank.name}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200"
                  >
                    {rank.name}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">
                Domain Leads
              </h2>

              <div className="space-y-2">
                {leads.length > 0 ? (
                  <div className="space-y-3">
                    {leads.map((rank: DomainRank) => {
                      const users = rank.users ?? [];
                      const rankKey = `leads-${rank.name}`;
                      const isExpanded = expandedRanks.has(rankKey);
                      const displayUsers = isExpanded
                        ? users
                        : users.slice(0, 3);

                      return (
                        <div key={rankKey}>
                          <h4 className="text-xs sm:text-sm text-[#A3A3A3] font-medium mb-2">
                            {rank.name}
                          </h4>
                          <div className="space-y-1">
                            {displayUsers.map((u) => (
                              <div
                                key={`${rank.name}-${u.srn}`}
                                className="text-xs sm:text-sm text-white"
                              >
                                {userMap[u.srn] ?? u.srn}
                              </div>
                            ))}
                          </div>
                          {users.length > 3 && (
                            <button
                              onClick={() => toggleRankExpand(rankKey)}
                              className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 mt-2 transition"
                            >
                              {isExpanded
                                ? "Show less"
                                : `+${users.length - 3} more`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[#A3A3A3]">
                    No leads assigned
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-white mb-4">
                Members
              </h2>

              <div className="space-y-2">
                {members.length > 0 ? (
                  <div className="space-y-3">
                    {members.map((rank: DomainRank) => {
                      const users = rank.users ?? [];
                      const rankKey = `members-${rank.name}`;
                      const isExpanded = expandedRanks.has(rankKey);
                      const displayUsers = isExpanded
                        ? users
                        : users.slice(0, 3);

                      return (
                        <div key={rankKey}>
                          <h4 className="text-xs sm:text-sm text-[#A3A3A3] font-medium mb-2">
                            {rank.name}
                          </h4>
                          <div className="space-y-1">
                            {displayUsers.map((u) => (
                              <div
                                key={`${rank.name}-${u.srn}`}
                                className="text-xs sm:text-sm text-white opacity-90"
                              >
                                {userMap[u.srn] ?? u.srn}
                              </div>
                            ))}
                          </div>
                          {users.length > 3 && (
                            <button
                              onClick={() => toggleRankExpand(rankKey)}
                              className="text-xs sm:text-sm text-purple-400 hover:text-purple-300 mt-2 transition"
                            >
                              {isExpanded
                                ? "Show less"
                                : `+${users.length - 3} more`}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-[#A3A3A3]">
                    No members assigned
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
