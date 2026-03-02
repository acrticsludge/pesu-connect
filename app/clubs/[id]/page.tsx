"use client";

import { useParams, notFound } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Club, ClubDomain, ClubRank, DomainRank } from "@/lib/types/club";
import Link from "next/link";
import { useClub } from "@/lib/hooks/useClubs";
import { useUser } from "@/lib/hooks/useUser";
import { useClubPermissions } from "@/lib/hooks/useClubPermissions";
import { useUserNames } from "@/lib/hooks/useUserNames";

const FALLBACK_BANNER = "/placeholder-banner.png";

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const [expandedRanks, setExpandedRanks] = useState<Set<string>>(new Set());

  const { data: user } = useUser();
  const { data: club, isLoading: clubLoading } = useClub(id);
  const { data: userMap = {} } = useUserNames(club);
  const { scope, isLoading: permissionsLoading } = useClubPermissions(
    user,
    club,
  );

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

  if (clubLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!club) return notFound();

  const ranks = club.ranks ?? [];
  const maxLevel =
    ranks.length > 0 ? Math.max(...ranks.map((r: ClubRank) => r.level)) : null;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-105 w-105 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-56 sm:h-72 md:h-80 w-full">
        <Image
          src={club.banner?.url || FALLBACK_BANNER}
          alt={club.banner?.alt || club.name || "Club Banner"}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <div className="flex flex-col gap-3">
              <nav className="mb-4 text-sm text-[#A3A3A3]">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/clubs" className="hover:text-white transition">
                      Clubs
                    </Link>
                  </li>
                  <span>›</span>
                  <li className="text-white font-medium truncate max-w-50 sm:max-w-md">
                    {club.name}
                  </li>
                </ol>
              </nav>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white wrap-break-word">
                  {club.name}
                </h1>

                {scope && scope !== "NONE" && (
                  <Link href={`/clubs/${club._id}/edit`} className="shrink-0">
                    <button className="relative px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-base text-white bg-linear-to-br from-[#7C3AED] via-[#9333EA] to-[#A855F7] shadow-[0_0_22px_rgba(168,85,247,0.8)] border border-purple-300/40 transition-all duration-200 hover:shadow-[0_0_36px_rgba(168,85,247,1)] hover:scale-[1.04] active:scale-[0.97] overflow-hidden cursor-pointer whitespace-nowrap">
                      <span className="relative z-10">Edit Club</span>
                      <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
                    </button>
                  </Link>
                )}
              </div>

              {club.isRecruiting && club.recruitingLink && (
                <button
                  onClick={() =>
                    window.open(
                      club.recruitingLink,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="w-fit px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold bg-green-500 text-black hover:bg-green-400 transition active:scale-95"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] min-w-0">
          <div className="space-y-6 sm:space-y-8 min-w-0">
            {club.fullDescription && (
              <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-2 sm:mb-3">
                  About
                </h2>
                <div
                  className="prose prose-invert max-w-none text-xs sm:text-sm md:text-base wrap-break-word overflow-x-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4"
                  dangerouslySetInnerHTML={{
                    __html: club.fullDescription,
                  }}
                />
              </section>
            )}

            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-4">
                Domains
              </h2>

              <div className="space-y-3 sm:space-y-4">
                {(club.domains ?? []).map((domain: ClubDomain) => (
                  <div
                    key={domain.name}
                    className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4"
                  >
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-1">
                      <Link
                        href={`/clubs/${club._id}/${slugify(domain.name)}`}
                        className="hover:text-purple-400 hover:underline transition"
                      >
                        {domain.name}
                      </Link>
                    </h3>

                    {domain.description && (
                      <p className="text-xs sm:text-sm text-[#A3A3A3] mb-2 sm:mb-3">
                        {domain.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {(domain.ranks ?? []).map((rank: DomainRank) => (
                        <span
                          key={rank.name}
                          className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200"
                        >
                          {rank.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
                Club Details
              </h2>

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-[#A3A3A3]">
                <div className="flex flex-wrap gap-1">
                  <span>Founded in</span>
                  <span className="text-white font-medium">
                    {new Date(club.foundedOn).getFullYear() || ""}
                  </span>
                </div>

                {club.staffCoordinator && (
                  <div className="flex flex-wrap gap-1">
                    <span>Staff Coordinator:</span>
                    <span className="text-white font-medium">
                      {club.staffCoordinator.name}
                    </span>
                  </div>
                )}

                {club.instagram && (
                  <a
                    href={club.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:underline inline-block"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                Team Structure
              </h2>

              <div className="space-y-5 sm:space-y-6">
                {ranks.length > 0 && (
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-purple-300 mb-3">
                      Club Leadership
                    </h3>

                    <div className="space-y-3">
                      {ranks
                        .filter(
                          (r: ClubRank) =>
                            maxLevel !== null && r.level < maxLevel,
                        )
                        .sort((a: ClubRank, b: ClubRank) => a.level - b.level)
                        .map((rank: ClubRank) => {
                          const users = rank.users ?? [];
                          const rankKey = `leadership-${rank.level}`;
                          const isExpanded = expandedRanks.has(rankKey);
                          const displayUsers = isExpanded
                            ? users
                            : users.slice(0, 3);

                          return (
                            <div key={`${rank.level}-group`}>
                              <h4 className="text-xs sm:text-sm text-[#A3A3A3] font-medium mb-2">
                                {rank.name}
                              </h4>
                              <div className="space-y-1">
                                {displayUsers.map((u) => (
                                  <div
                                    key={`${rank.level}-${u.srn}`}
                                    className="text-xs sm:text-sm text-white truncate"
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
                  </div>
                )}

                {(club.domains ?? []).map((domain: ClubDomain) => (
                  <div key={domain.name}>
                    <h3 className="text-xs sm:text-sm font-semibold text-purple-300 mb-3">
                      {domain.name}
                    </h3>

                    <div className="space-y-3">
                      {(domain.ranks ?? [])
                        .sort(
                          (a: DomainRank, b: DomainRank) => a.level - b.level,
                        )
                        .map((rank: DomainRank) => {
                          const users = rank.users ?? [];
                          const rankKey = `${domain.name}-${rank.name}`;
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
                                    className="text-xs sm:text-sm text-white truncate"
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
