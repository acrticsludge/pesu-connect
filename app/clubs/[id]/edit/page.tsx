/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Club } from "@/lib/types/club";
import {
  getClubEditScope,
  getEditableDomainIndexes,
} from "@/lib/permissions/clubPermissions";

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [club, setClub] = useState<Club | null>(null);
  const [saving, setSaving] = useState(false);
  const [allSrns, setAllSrns] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    fetch("/api/users/by-srn")
      .then((r) => r.json())
      .then(setAllSrns);
  }, []);

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((r) => r.json())
      .then((data) =>
        setClub({
          ...data,
          banner: data.banner ?? { url: "", alt: "" },
          staffCoordinator: data.staffCoordinator ?? {
            name: "",
            department: "",
          },
          ranks: (data.ranks ?? []).map((r: any, i: number) => ({
            name: r.name ?? "",
            level: r.level ?? i + 1,
            users: r.users ?? [],
          })),
          domains: (data.domains ?? []).map((d: any) => ({
            name: d.name ?? "",
            description: d.description ?? "",
            ranks: (d.ranks ?? []).map((r: any, i: number) => ({
              name: r.name ?? "",
              level: r.level ?? i + 1,
              users: r.users ?? [],
            })),
          })),
        }),
      );
  }, [id]);

  if (!club || !user) {
    return <div className="py-24 text-center text-white/60">Loading…</div>;
  }

  const actualUser = user.user;

  const scope = getClubEditScope({ user: actualUser, club });
  const editableDomains = getEditableDomainIndexes({
    user: actualUser,
    club,
  });

  if (scope === "NONE") {
    return (
      <div className="py-24 text-center text-red-400">
        You do not have permission to edit this club.
      </div>
    );
  }

  const isAdmin = scope === "ADMIN";
  const isClubLead = scope === "CLUB";
  const isDomainLead = scope === "DOMAIN";
  const clubLocked = isDomainLead;

  const normalizeLevels = (ranks: any[]) =>
    ranks.map((r, i) => ({ ...r, level: i + 1 }));

  const moveItem = <T,>(arr: T[], from: number, to: number) => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const UserSelect = ({ onPick }: { onPick: (srn: string) => void }) => (
    <select
      defaultValue=""
      className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white"
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
  );

  const save = async () => {
    if (club.isRecruiting && !club.recruitingLink?.trim()) {
      alert("Recruitment form link is required");
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
      alert(data.error || "Failed to save");
      return;
    }

    router.refresh();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      <nav className="text-sm text-white/50">
        <span
          className="cursor-pointer hover:text-white"
          onClick={() => router.push("/clubs")}
        >
          Clubs
        </span>{" "}
        ›{" "}
        <span
          className="cursor-pointer hover:text-white"
          onClick={() => router.push(`/clubs/${club._id}`)}
        >
          {club.name}
        </span>{" "}
        › <span className="text-white">Edit</span>
      </nav>

      <h1 className="text-2xl font-bold text-white">Edit Club</h1>

      <section className="space-y-4">
        <h2 className="text-sm uppercase text-purple-300">Basic Information</h2>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          disabled={clubLocked}
          value={club.name}
          onChange={(e) => setClub({ ...club, name: e.target.value })}
          placeholder="Club name"
        />

        <textarea
          disabled={clubLocked}
          rows={2}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          value={club.shortDescription ?? ""}
          onChange={(e) =>
            setClub({ ...club, shortDescription: e.target.value })
          }
          placeholder="Short description"
        />

        <textarea
          disabled={clubLocked}
          rows={4}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          value={club.fullDescription ?? ""}
          onChange={(e) =>
            setClub({ ...club, fullDescription: e.target.value })
          }
          placeholder="Full description"
        />

        <input
          type="date"
          disabled={clubLocked}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          value={club.foundedOn.slice(0, 10)}
          onChange={(e) => setClub({ ...club, foundedOn: e.target.value })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase text-purple-300">Media & Links</h2>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          disabled={clubLocked}
          value={club.banner?.url ?? ""}
          onChange={(e) =>
            setClub({
              ...club,
              banner: { ...club.banner!, url: e.target.value },
            })
          }
          placeholder="Banner image URL"
        />

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          disabled={clubLocked}
          value={club.instagram ?? ""}
          onChange={(e) => setClub({ ...club, instagram: e.target.value })}
          placeholder="Instagram link"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase text-purple-300">Recruitment</h2>

        <label className="flex items-center gap-3 text-white disabled:opacity-50">
          <input
            type="checkbox"
            disabled={clubLocked}
            checked={club.isRecruiting}
            onChange={(e) =>
              setClub({ ...club, isRecruiting: e.target.checked })
            }
          />
          Recruiting
        </label>

        {club.isRecruiting && (
          <input
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
            disabled={clubLocked}
            value={club.recruitingLink ?? ""}
            onChange={(e) =>
              setClub({ ...club, recruitingLink: e.target.value })
            }
            placeholder="Recruitment form link"
          />
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm uppercase text-purple-300">Staff Coordinator</h2>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          disabled={clubLocked}
          value={club.staffCoordinator?.name ?? ""}
          onChange={(e) =>
            setClub({
              ...club,
              staffCoordinator: {
                ...club.staffCoordinator!,
                name: e.target.value,
              },
            })
          }
          placeholder="Name"
        />

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white disabled:opacity-50"
          disabled={clubLocked}
          value={club.staffCoordinator?.department ?? ""}
          onChange={(e) =>
            setClub({
              ...club,
              staffCoordinator: {
                ...club.staffCoordinator!,
                department: e.target.value,
              },
            })
          }
          placeholder="Department"
        />
      </section>

      <section
        className={`space-y-6 ${clubLocked ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-sm uppercase text-purple-300">Club Ranks</h2>

        {club.ranks.map((rank, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
          >
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 rounded-lg bg-white/10 px-3 py-3 text-white"
                value={rank.name}
                onChange={(e) => {
                  const r = [...club.ranks];
                  r[i].name = e.target.value;
                  setClub({ ...club, ranks: r });
                }}
              />

              <div className="flex flex-col">
                <button
                  disabled={i === 0}
                  className="text-purple-300 disabled:opacity-30"
                  onClick={() =>
                    setClub({
                      ...club,
                      ranks: normalizeLevels(moveItem(club.ranks, i, i - 1)),
                    })
                  }
                >
                  ▲
                </button>
                <button
                  disabled={i === club.ranks.length - 1}
                  className="text-purple-300 disabled:opacity-30"
                  onClick={() =>
                    setClub({
                      ...club,
                      ranks: normalizeLevels(moveItem(club.ranks, i, i + 1)),
                    })
                  }
                >
                  ▼
                </button>
              </div>

              <span className="w-10 text-center font-mono text-purple-300">
                {rank.level}
              </span>
            </div>

            {rank.users.map((u, ui) => (
              <div key={ui} className="flex justify-between text-sm text-white">
                <span>{u.srn}</span>
                <button
                  className="text-red-400"
                  onClick={() => {
                    const r = [...club.ranks];
                    r[i].users = r[i].users.filter((_, x) => x !== ui);
                    setClub({ ...club, ranks: r });
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <UserSelect
              onPick={(srn) =>
                setClub((prev) => {
                  if (!prev) return prev;

                  return {
                    ...prev,
                    ranks: prev.ranks.map((rank, idx) =>
                      idx === i
                        ? { ...rank, users: [...rank.users, { srn }] }
                        : rank,
                    ),
                  };
                })
              }
            />

            <button
              className="w-full rounded-lg bg-red-500/20 text-red-300 py-2"
              onClick={() =>
                setClub({
                  ...club,
                  ranks: normalizeLevels(club.ranks.filter((_, x) => x !== i)),
                })
              }
            >
              Delete rank
            </button>
          </div>
        ))}

        <button
          className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300"
          onClick={() =>
            setClub({
              ...club,
              ranks: normalizeLevels([
                ...club.ranks,
                { name: "", level: club.ranks.length + 1, users: [] },
              ]),
            })
          }
        >
          + Add rank
        </button>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm uppercase text-purple-300">Domains</h2>

        {club.domains.map((domain, di) => {
          const domainLocked = isDomainLead && !editableDomains.includes(di);
          return (
            <div
              key={di}
              className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4"
            >
              <input
                className="w-full rounded-lg bg-white/10 px-3 py-3 text-white disabled:opacity-50"
                disabled={domainLocked}
                value={domain.name}
                onChange={(e) => {
                  const d = [...club.domains];
                  d[di].name = e.target.value;
                  setClub({ ...club, domains: d });
                }}
                placeholder="Domain name"
              />

              <textarea
                rows={2}
                className="w-full rounded-lg bg-white/10 px-3 py-3 text-white disabled:opacity-50"
                disabled={domainLocked}
                value={domain.description ?? ""}
                onChange={(e) => {
                  const d = [...club.domains];
                  d[di].description = e.target.value;
                  setClub({ ...club, domains: d });
                }}
                placeholder="Domain description"
              />
              <div
                className={domainLocked ? "opacity-50 pointer-events-none" : ""}
              >
                {domain.ranks.map((rank, ri) => {
                  return (
                    <div
                      key={ri}
                      className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3"
                    >
                      <div className="flex gap-2 items-center">
                        <input
                          className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-white"
                          value={rank.name}
                          onChange={(e) => {
                            const d = [...club.domains];
                            d[di].ranks[ri].name = e.target.value;
                            setClub({ ...club, domains: d });
                          }}
                        />

                        <div className="flex flex-col">
                          <button
                            disabled={ri === 0}
                            className="text-purple-300 disabled:opacity-30"
                            onClick={() => {
                              const d = [...club.domains];
                              d[di].ranks = normalizeLevels(
                                moveItem(d[di].ranks, ri, ri - 1),
                              );
                              setClub({ ...club, domains: d });
                            }}
                          >
                            ▲
                          </button>
                          <button
                            disabled={ri === domain.ranks.length - 1}
                            className="text-purple-300 disabled:opacity-30"
                            onClick={() => {
                              const d = [...club.domains];
                              d[di].ranks = normalizeLevels(
                                moveItem(d[di].ranks, ri, ri + 1),
                              );
                              setClub({ ...club, domains: d });
                            }}
                          >
                            ▼
                          </button>
                        </div>

                        <span className="w-10 text-center font-mono text-purple-300">
                          {rank.level}
                        </span>
                      </div>

                      {rank.users.map((u, ui) => (
                        <div
                          key={ui}
                          className="flex justify-between text-sm text-white"
                        >
                          <span>{u.srn}</span>
                          <button
                            className="text-red-400"
                            onClick={() => {
                              const d = [...club.domains];
                              d[di].ranks[ri].users = d[di].ranks[
                                ri
                              ].users.filter((_, x) => x !== ui);
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
                          d[di].ranks[ri].users.push({ srn });
                          setClub({ ...club, domains: d });
                        }}
                      />

                      <button
                        className="w-full rounded-lg bg-red-500/20 text-red-300 py-2 text-sm"
                        onClick={() => {
                          const d = [...club.domains];
                          d[di].ranks = normalizeLevels(
                            d[di].ranks.filter((_, x) => x !== ri),
                          );
                          setClub({ ...club, domains: d });
                        }}
                      >
                        Delete rank
                      </button>
                    </div>
                  );
                })}

                <button
                  className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
                  onClick={() => {
                    const d = [...club.domains];
                    d[di].ranks = normalizeLevels([
                      ...d[di].ranks,
                      { name: "", level: d[di].ranks.length + 1, users: [] },
                    ]);
                    setClub({ ...club, domains: d });
                  }}
                >
                  + Add domain rank
                </button>
              </div>
              <button
                className="w-full rounded-lg bg-red-600/30 text-red-300 py-2 text-sm"
                disabled={domainLocked}
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
          );
        })}

        <button
          className="px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 disabled:opacity-50"
          disabled={isDomainLead}
          onClick={() =>
            setClub({
              ...club,
              domains: [
                ...club.domains,
                { name: "", description: "", ranks: [] },
              ],
            })
          }
        >
          + Add domain
        </button>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>

      {isAdmin && (
        <button
          onClick={async () => {
            if (!confirm("Delete this club permanently?")) return;
            await fetch(`/api/clubs/${id}/edit`, { method: "DELETE" });
            router.push("/clubs");
          }}
          className="w-full py-3 rounded-xl bg-red-700 text-white font-semibold"
        >
          Delete Club
        </button>
      )}
    </div>
  );
}
