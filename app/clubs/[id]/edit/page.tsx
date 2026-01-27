"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Club } from "@/lib/types/club";

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [saving, setSaving] = useState(false);
  const [allSrns, setAllSrns] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/users/by-srn")
      .then((r) => r.json())
      .then(setAllSrns);
  }, []);

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        data.ranks = (data.ranks ?? []).map((r: any) => ({
          ...r,
          users: r.users ?? [],
        }));
        data.domains = (data.domains ?? []).map((d: any) => ({
          ...d,
          ranks: d.ranks ?? [],
          members: d.members ?? [],
          domainLeads: d.domainLeads ?? [],
        }));
        setClub(data);
      });
  }, [id]);

  const clubRanks = useMemo(() => {
    if (!club) return [];
    return club.ranks.map((rank) => ({
      ...rank,
      users: [
        ...(rank.users ?? []),
        ...(rank.name === "Club Lead"
          ? club.clubLeads.map((l) => ({ srn: l.srn }))
          : []),
      ],
    }));
  }, [club]);

  if (!club) {
    return <div className="py-24 text-center text-white/60">Loading club…</div>;
  }

  const validateUniqueRanks = () => {
    const clubSeen = new Set<string>();

    for (const rank of club.ranks ?? []) {
      for (const u of rank.users ?? []) {
        if (clubSeen.has(u.srn)) {
          return `User ${u.srn} has multiple club ranks`;
        }
        clubSeen.add(u.srn);
      }
    }

    for (const domain of club.domains ?? []) {
      const domainSeen = new Set<string>();

      for (const member of domain.members ?? []) {
        if (domainSeen.has(member.srn)) {
          return `User ${member.srn} has multiple ranks in ${domain.name}`;
        }
        domainSeen.add(member.srn);
      }
    }

    return null;
  };

  const save = async () => {
    if (club.isRecruiting && !club.recruitingLink?.trim()) {
      alert("Recruitment form link is required");
      return;
    }

    const rankError = validateUniqueRanks();
    if (rankError) {
      alert(rankError);
      return;
    }
    setSaving(true);

    const res = await fetch(`/api/clubs/${id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(club),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      alert(data.error || "Failed to save changes");
      return;
    }

    router.refresh();
  };

  const UserSelect = ({ onPick }: { onPick: (srn: string) => void }) => (
    <div className="relative">
      <select
        defaultValue=""
        className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        onChange={(e) => {
          if (!e.target.value) return;
          onPick(e.target.value);
          e.currentTarget.value = "";
        }}
      >
        <option value="" disabled>
          Select user SRN
        </option>
        {allSrns.map((s) => (
          <option key={s} value={s} className="bg-[#0f0f1a]">
            {s}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
        ▼
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      <nav className="text-sm text-white/50 mb-4">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <a href="/clubs" className="hover:text-white transition">
              Clubs
            </a>
          </li>
          <span>›</span>
          <li>
            <a
              href={`/clubs/${club._id}`}
              className="hover:text-white transition"
            >
              {club.name}
            </a>
          </li>
          <span>›</span>
          <li className="text-white font-medium">Edit</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-white">Edit Club</h1>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Basic Info
        </h2>

        <input
          placeholder="Club name"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.name}
          onChange={(e) => setClub({ ...club, name: e.target.value })}
        />

        <textarea
          rows={3}
          placeholder="Short description (shown on cards)"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.shortDescription || ""}
          onChange={(e) =>
            setClub({ ...club, shortDescription: e.target.value })
          }
        />

        <textarea
          rows={5}
          placeholder="Full description (shown on club page)"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.fullDescription || ""}
          onChange={(e) =>
            setClub({ ...club, fullDescription: e.target.value })
          }
        />

        <input
          type="date"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white"
          value={club.foundedOn.slice(0, 10)}
          onChange={(e) => setClub({ ...club, foundedOn: e.target.value })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Media & Links
        </h2>

        <input
          placeholder="Banner image URL (background image)"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.banner?.url || ""}
          onChange={(e) =>
            setClub({
              ...club,
              banner: {
                url: e.target.value,
                alt: club.banner?.alt || club.name,
              },
            })
          }
        />

        <input
          placeholder="Instagram profile link"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.instagram || ""}
          onChange={(e) => setClub({ ...club, instagram: e.target.value })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Recruitment
        </h2>

        <label className="flex items-center gap-3 text-white text-sm">
          <input
            type="checkbox"
            checked={club.isRecruiting}
            onChange={(e) =>
              setClub({ ...club, isRecruiting: e.target.checked })
            }
          />
          Currently recruiting
        </label>

        {club.isRecruiting && (
          <input
            placeholder="Recruitment / application form link"
            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
            value={club.recruitingLink || ""}
            onChange={(e) =>
              setClub({ ...club, recruitingLink: e.target.value })
            }
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Staff Coordinator
        </h2>

        <input
          placeholder="Staff coordinator name"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.staffCoordinator?.name || ""}
          onChange={(e) =>
            setClub({
              ...club,
              staffCoordinator: {
                name: e.target.value,
                department: club.staffCoordinator?.department || "",
              },
            })
          }
        />

        <input
          placeholder="Staff coordinator department"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.staffCoordinator?.department || ""}
          onChange={(e) =>
            setClub({
              ...club,
              staffCoordinator: {
                name: club.staffCoordinator?.name || "",
                department: e.target.value,
              },
            })
          }
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Club Ranks
        </h2>

        {clubRanks.map((rank, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
          >
            <div className="flex gap-2">
              <input
                placeholder="Rank name"
                className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
                value={rank.name}
                onChange={(e) => {
                  const r = [...club.ranks];
                  r[i].name = e.target.value;
                  setClub({ ...club, ranks: r });
                }}
              />
              <input
                type="number"
                placeholder="Level"
                className="w-20 rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
                value={rank.level}
                onChange={(e) => {
                  const r = [...club.ranks];
                  r[i].level = Number(e.target.value);
                  setClub({ ...club, ranks: r });
                }}
              />
            </div>

            {(rank.users ?? []).map((u, ui) => (
              <div
                key={ui}
                className="flex items-center justify-between text-sm text-white"
              >
                <span>{u.srn}</span>
                <button
                  className="text-red-400"
                  onClick={() => {
                    const r = [...club.ranks];
                    r[i].users = (r[i].users ?? []).filter((_, x) => x !== ui);
                    setClub({ ...club, ranks: r });
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <UserSelect
              onPick={(srn) => {
                const r = [...club.ranks];
                r[i].users = [...(r[i].users ?? []), { srn }];
                setClub({ ...club, ranks: r });
              }}
            />

            <button
              className="w-full rounded-lg bg-red-500/20 text-red-300 py-2 text-sm"
              onClick={() =>
                setClub({
                  ...club,
                  ranks: club.ranks.filter((_, x) => x !== i),
                })
              }
            >
              Delete rank
            </button>
          </div>
        ))}

        <button
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
          onClick={() =>
            setClub({
              ...club,
              ranks: [...club.ranks, { name: "", level: 0, users: [] }],
            })
          }
        >
          + Add rank
        </button>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-wide text-purple-300">
          Domains
        </h2>

        {club.domains.map((domain, di) => (
          <div
            key={di}
            className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-5"
          >
            <input
              placeholder="Domain name"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
              value={domain.name}
              onChange={(e) => {
                const d = [...club.domains];
                d[di].name = e.target.value;
                setClub({ ...club, domains: d });
              }}
            />

            <textarea
              rows={2}
              placeholder="Domain description"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
              value={domain.description || ""}
              onChange={(e) => {
                const d = [...club.domains];
                d[di].description = e.target.value;
                setClub({ ...club, domains: d });
              }}
            />

            {(domain.ranks ?? []).map((rank, ri) => {
              const assigned = (domain.members ?? []).filter(
                (m) => m.rank === rank.name,
              );

              return (
                <div
                  key={ri}
                  className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3"
                >
                  <div className="flex gap-2">
                    <input
                      placeholder="Rank name"
                      className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
                      value={rank.name}
                      onChange={(e) => {
                        const d = [...club.domains];
                        const old = d[di].ranks[ri].name;
                        d[di].ranks[ri].name = e.target.value;
                        d[di].members = (d[di].members ?? []).map((m) =>
                          m.rank === old ? { ...m, rank: e.target.value } : m,
                        );
                        setClub({ ...club, domains: d });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Level"
                      className="w-20 rounded-lg bg-white/10 border border-white/10 px-3 py-3 text-white placeholder:text-white/40"
                      value={rank.level}
                      onChange={(e) => {
                        const d = [...club.domains];
                        d[di].ranks[ri].level = Number(e.target.value);
                        setClub({ ...club, domains: d });
                      }}
                    />
                  </div>

                  {assigned.map((m, mi) => (
                    <div
                      key={mi}
                      className="flex items-center justify-between text-sm text-white"
                    >
                      <span>{m.srn}</span>
                      <button
                        className="text-red-400"
                        onClick={() => {
                          const d = [...club.domains];
                          d[di].members = (d[di].members ?? []).filter(
                            (x) => !(x.srn === m.srn && x.rank === rank.name),
                          );
                          setClub({ ...club, domains: d });
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <UserSelect
                    onPick={(srn) => {
                      const d = [...club.domains];
                      d[di].members = [
                        ...(d[di].members ?? []),
                        { srn, rank: rank.name },
                      ];
                      setClub({ ...club, domains: d });
                    }}
                  />

                  <button
                    className="w-full rounded-lg bg-red-500/20 text-red-300 py-2 text-sm"
                    onClick={() => {
                      const d = [...club.domains];
                      d[di].members = (d[di].members ?? []).filter(
                        (m) => m.rank !== rank.name,
                      );
                      d[di].ranks = d[di].ranks.filter((_, x) => x !== ri);
                      setClub({ ...club, domains: d });
                    }}
                  >
                    Delete rank
                  </button>
                </div>
              );
            })}

            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
                onClick={() => {
                  const d = [...club.domains];
                  d[di].ranks = [
                    ...(d[di].ranks ?? []),
                    { name: "", level: 0 },
                  ];
                  setClub({ ...club, domains: d });
                }}
              >
                + Add domain rank
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm"
                onClick={() =>
                  setClub({
                    ...club,
                    domains: club.domains.filter((_, x) => x !== di),
                  })
                }
              >
                Delete domain
              </button>
            </div>
          </div>
        ))}
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>

      <button
        className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold"
        onClick={async () => {
          if (!confirm("Delete club?")) return;
          await fetch(`/api/clubs/${id}/edit`, { method: "DELETE" });
          router.push("/");
        }}
      >
        Delete Club
      </button>
    </div>
  );
}
