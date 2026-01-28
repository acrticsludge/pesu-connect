"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import { getClubEditScope } from "@/lib/permissions/clubPermissions";
import { Club } from "@/lib/types/club";
import Link from "next/link";

export default function ClubPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<any>(null);

  const [club, setClub] = useState<Club | null>(null);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

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

    (club.ranks ?? []).forEach((r) =>
      (r.users ?? []).forEach((u) => srns.add(u.srn)),
    );

    (club.domains ?? []).forEach((d) =>
      (d.ranks ?? []).forEach((r) =>
        (r.users ?? []).forEach((u) => srns.add(u.srn)),
      ),
    );

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
      <div className="text-center text-[#A3A3A3] py-20">Loading club...</div>
    );
  }
  if (!club || user === null) {
    <div className="text-center text-[#A3A3A3] py-20">Loading club...</div>;
  }

  const actualUser = user?.user ?? null;

  if (!actualUser) {
    return (
      <div className="py-24 text-center text-red-400">
        You are not logged in.
      </div>
    );
  }

  const scope = getClubEditScope({ user: actualUser, club });

  if (!club) {
    return notFound();
  }

  function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, "-");
  }

  const ranks = club.ranks ?? [];
  const maxLevel =
    ranks.length > 0 ? Math.max(...ranks.map((r) => r.level)) : null;

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-105 w-105 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-56 sm:h-72 md:h-80 w-full">
        <Image
          src={club.banner?.url || "/placeholder-banner.png"}
          alt={club.banner?.alt || club.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <div className="flex flex-col gap-3">
              <nav className="mb-4 text-sm text-[#A3A3A3]">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/clubs" className="hover:text-white">
                      Clubs
                    </Link>
                  </li>
                  <span>›</span>
                  <li className="text-white font-medium">{club.name}</li>
                </ol>
              </nav>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {club.name}
                </h1>

                {(scope === "ADMIN" ||
                  scope === "CLUB" ||
                  scope === "DOMAIN") && (
                  <Link href={`/clubs/${club._id}/edit`}>
                    <button
                      className="
          relative px-6 py-2.5
          rounded-full font-bold text-sm sm:text-base
          text-white
          bg-linear-to-br from-[#7C3AED] via-[#9333EA] to-[#A855F7]
          shadow-[0_0_22px_rgba(168,85,247,0.8)]
          border border-purple-300/40
          transition-all duration-200
          hover:shadow-[0_0_36px_rgba(168,85,247,1)]
          hover:scale-[1.04]
          active:scale-[0.97]
          overflow-hidden
          cursor-pointer
        "
                    >
                      <span className="relative z-10">Edit Club</span>

                      <span
                        className="
            absolute inset-0
            bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)]
            opacity-0 hover:opacity-100
            transition-opacity
          "
                      />
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
                  className="w-fit px-5 py-2 rounded-full text-sm font-semibold bg-green-500 text-black hover:bg-green-400 transition"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            {club.fullDescription && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  About
                </h2>
                <p className="text-sm sm:text-base text-[#A3A3A3] leading-relaxed">
                  {club.fullDescription}
                </p>
              </section>
            )}

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Domains
              </h2>

              <div className="space-y-4">
                {(club.domains ?? []).map((domain) => (
                  <div
                    key={domain.name}
                    className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4"
                  >
                    <h3 className="font-semibold text-white mb-1">
                      <Link
                        href={`/clubs/${club._id}/${slugify(domain.name)}`}
                        className="hover:text-purple-400 hover:underline"
                      >
                        {domain.name}
                      </Link>
                    </h3>

                    {domain.description && (
                      <p className="text-sm text-[#A3A3A3] mb-3">
                        {domain.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {(domain.ranks ?? []).map((rank) => (
                        <span
                          key={rank.name}
                          className="px-3 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200"
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

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-3">
                Club Details
              </h2>

              <div className="space-y-3 text-sm text-[#A3A3A3]">
                <div>
                  Founded in{" "}
                  <span className="text-white font-medium">
                    {new Date(club.foundedOn).getFullYear()}
                  </span>
                </div>

                {club.staffCoordinator && (
                  <div>
                    Staff Coordinator:{" "}
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
                    className="text-purple-400 hover:underline"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-4">
                Team Structure
              </h2>

              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-purple-300 mb-2">
                    Club Leadership
                  </h3>

                  <div className="space-y-1">
                    {ranks
                      .filter((r) => maxLevel !== null && r.level < maxLevel)
                      .sort((a, b) => a.level - b.level)
                      .flatMap((rank) =>
                        (rank.users ?? []).map((u) => (
                          <div
                            key={`${rank.level}-${u.srn}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-white">
                              {userMap[u.srn] ?? "Null User"}
                            </span>
                            <span className="text-[#A3A3A3]">{rank.name}</span>
                          </div>
                        )),
                      )}
                  </div>
                </div>

                {(club.domains ?? []).map((domain) => (
                  <div key={domain.name}>
                    <h3 className="text-sm font-semibold text-purple-300 mb-2">
                      {domain.name}
                    </h3>

                    <div className="space-y-1 ml-2">
                      {(domain.ranks ?? [])
                        .sort((a, b) => a.level - b.level)
                        .flatMap((rank) =>
                          (rank.users ?? []).map((u) => (
                            <div
                              key={`${rank.name}-${u.srn}`}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-white">
                                {userMap[u.srn] ?? "Null User"}
                              </span>
                              <span className="text-[#A3A3A3]">
                                {rank.name}
                              </span>
                            </div>
                          )),
                        )}
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
