"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Club, ClubRank, ClubDomain, DomainRank } from "@/lib/types/club";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import {
  getClubEditScope,
  getEditableDomainIndexes,
} from "@/lib/permissions/clubPermissions";
import { useUser } from "@/lib/hooks/useUser";
import { useClub } from "@/lib/hooks/useClubs";
import { useAllSrns } from "@/lib/hooks/useAllSrns";
import { useUpdateClub } from "@/lib/hooks/useUpdateClub";
import { useDeleteClub } from "@/lib/hooks/useDeleteClub";
import { useQueryClient } from "@tanstack/react-query";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: user } = useUser();
  const { data: club, isLoading: clubLoading } = useClub(id);
  const { data: allSrns = [] } = useAllSrns();
  const updateClub = useUpdateClub(id);
  const deleteClub = useDeleteClub(id);

  const [localClub, setLocalClub] = useState<Club | null>(null);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (club) {
      setLocalClub({
        ...club,
        banner: club.banner ?? { url: "", alt: "" },
        staffCoordinator: club.staffCoordinator ?? {
          name: "",
          department: "",
        },
        ranks: (club.ranks ?? []).map((r: ClubRank, i: number) => ({
          name: r.name ?? "",
          level: r.level ?? i + 1,
          users: r.users ?? [],
        })),
        domains: (club.domains ?? []).map((d: ClubDomain) => ({
          name: d.name ?? "",
          description: d.description ?? "",
          ranks: (d.ranks ?? []).map((r: DomainRank, i: number) => ({
            name: r.name ?? "",
            level: r.level ?? i + 1,
            users: r.users ?? [],
          })),
        })),
      });
    }
  }, [club]);

  if (clubLoading || !localClub || !user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const actualUser = user;

  const scope = getClubEditScope({ user: actualUser, club: localClub });
  const editableDomains = getEditableDomainIndexes({
    user: actualUser,
    club: localClub,
  });

  if (scope === "NONE") {
    return (
      <div className="py-24 text-center text-red-400 px-4">
        You do not have permission to edit this club.
      </div>
    );
  }

  const isAdmin = scope === "ADMIN";
  const isDomainLead = scope === "DOMAIN";
  const clubLocked = isDomainLead;

  const confirmAction = (message: string) => {
    return window.confirm(message);
  };

  const normalizeLevels = (ranks: (ClubRank | DomainRank)[]) =>
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
      className="w-full rounded-xl bg-[#1a1a2e] border border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-xs sm:text-sm"
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!e.target.value) return;
        onPick(e.target.value);
        e.currentTarget.value = "";
      }}
    >
      <option value="" disabled className="bg-[#1a1a2e] text-white/60">
        Select user SRN
      </option>
      {allSrns.map((s: string) => (
        <option key={s} value={s} className="bg-[#1a1a2e] text-white">
          {s}
        </option>
      ))}
    </select>
  );

  const handleSave = async () => {
    if (localClub.isRecruiting && !localClub.recruitingLink?.trim()) {
      toast.error("Recruitment form link is required");
      return;
    }

    setSaving(true);
    updateClub.mutate(localClub, {
      onSettled: () => setSaving(false),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["clubs"] });
        router.refresh();
      },
    });
  };

  const saveWith = async (data: Club) => {
    setSaving(true);
    updateClub.mutate(data, {
      onSettled: () => setSaving(false),
    });
  };

  const saveAndExit = async (
    nextClub: Club,
    confirmText: string,
    successText: string,
  ) => {
    if (!confirmAction(confirmText)) return;
    setSaving(true);
    updateClub.mutate(nextClub, {
      onSettled: () => setSaving(false),
      onSuccess: () => {
        toast.success(successText);
        router.replace(`/clubs/${id}`);
      },
    });
  };

  const handleDelete = async () => {
    if (!confirmAction("Delete this club permanently?")) return;
    deleteClub.mutate(undefined, {
      onSuccess: () => {
        router.push("/clubs");
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-10 space-y-6 sm:space-y-8 md:space-y-12 overflow-x-hidden">
      <nav className="text-xs sm:text-sm text-white/50 flex flex-wrap items-center gap-1">
        <span
          className="cursor-pointer hover:text-white transition"
          onClick={() => router.push("/clubs")}
        >
          Clubs
        </span>
        <span>›</span>
        <span
          className="cursor-pointer hover:text-white truncate max-w-32 sm:max-w-40 md:max-w-xs transition"
          onClick={() => router.push(`/clubs/${localClub._id}`)}
        >
          {localClub.name}
        </span>
        <span>›</span>
        <span className="text-white">Edit</span>
      </nav>

      <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
        Edit Club
      </h1>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Basic Information
        </h2>

        <input
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          disabled={clubLocked || saving}
          value={localClub.name ?? ""}
          onChange={(e) => setLocalClub({ ...localClub, name: e.target.value })}
          placeholder="Club name"
        />

        <textarea
          disabled={clubLocked || saving}
          rows={2}
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          value={localClub.shortDescription ?? ""}
          onChange={(e) =>
            setLocalClub({ ...localClub, shortDescription: e.target.value })
          }
          placeholder="Short description"
        />

        <div
          className={`w-full rounded-xl bg-white/10 px-3 sm:px-4 py-3 ${
            clubLocked || saving ? "opacity-50" : ""
          }`}
        >
          <ReactQuill
            value={localClub?.fullDescription ?? ""}
            readOnly={clubLocked || saving}
            onChange={(html) =>
              setLocalClub((prev) =>
                prev ? { ...prev, fullDescription: html } : prev,
              )
            }
            placeholder="Full Description"
            theme="snow"
            modules={{
              toolbar:
                clubLocked || saving
                  ? false
                  : [
                      ["bold", "italic", "underline"],
                      [{ header: [2, 3, false] }],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["clean"],
                    ],
            }}
            className="text-white [&_.ql-editor]:min-h-32 sm:[&_.ql-editor]:min-h-40 [&_.ql-editor]:text-xs sm:[&_.ql-editor]:text-sm [&_.ql-editor]:text-white [&_.ql-container]:bg-transparent [&_.ql-toolbar]:bg-transparent [&_.ql-toolbar]:border-white/10 [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white"
          />
        </div>

        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Founded on
        </h2>

        <input
          type="date"
          disabled={clubLocked || saving}
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          value={localClub.foundedOn?.slice(0, 10) ?? ""}
          onChange={(e) =>
            setLocalClub({ ...localClub, foundedOn: e.target.value })
          }
        />
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Media & Links
        </h2>

        <input
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          disabled={clubLocked || saving}
          value={localClub.banner?.url ?? ""}
          onChange={(e) =>
            setLocalClub({
              ...localClub,
              banner: { ...localClub.banner!, url: e.target.value },
            })
          }
          placeholder="Banner image URL"
        />

        <input
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          disabled={clubLocked || saving}
          value={localClub.instagram ?? ""}
          onChange={(e) =>
            setLocalClub({ ...localClub, instagram: e.target.value })
          }
          placeholder="Instagram link"
        />
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Recruitment
        </h2>

        <label className="flex items-center gap-2 sm:gap-3 text-white text-xs sm:text-sm cursor-pointer">
          <input
            type="checkbox"
            disabled={clubLocked || saving}
            checked={localClub.isRecruiting ?? false}
            onChange={(e) =>
              setLocalClub({ ...localClub, isRecruiting: e.target.checked })
            }
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-purple-500"
          />
          Recruiting
        </label>

        {localClub.isRecruiting && (
          <input
            className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
            disabled={clubLocked || saving}
            value={localClub.recruitingLink ?? ""}
            onChange={(e) =>
              setLocalClub({ ...localClub, recruitingLink: e.target.value })
            }
            placeholder="Recruitment form link"
          />
        )}
      </section>

      <section className="space-y-3 sm:space-y-4">
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Staff Coordinator
        </h2>

        <input
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          disabled={clubLocked || saving}
          value={localClub.staffCoordinator?.name ?? ""}
          onChange={(e) =>
            setLocalClub({
              ...localClub,
              staffCoordinator: {
                ...localClub.staffCoordinator!,
                name: e.target.value,
              },
            })
          }
          placeholder="Name"
        />

        <input
          className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-2.5 sm:py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
          disabled={clubLocked || saving}
          value={localClub.staffCoordinator?.department ?? ""}
          onChange={(e) =>
            setLocalClub({
              ...localClub,
              staffCoordinator: {
                ...localClub.staffCoordinator!,
                department: e.target.value,
              },
            })
          }
          placeholder="Department"
        />
      </section>

      <section
        className={`space-y-4 sm:space-y-6 ${clubLocked || saving ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Club Ranks
        </h2>

        {localClub.ranks.map((rank, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4 space-y-3"
          >
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 rounded-lg bg-white/10 px-2 sm:px-3 py-2 sm:py-3 text-white text-xs sm:text-sm"
                value={rank.name ?? ""}
                onChange={(e) => {
                  setLocalClub({
                    ...localClub,
                    ranks: localClub.ranks.map((r, idx) =>
                      idx === i ? { ...r, name: e.target.value } : r,
                    ),
                  });
                }}
              />

              <div className="flex flex-col">
                <button
                  disabled={i === 0}
                  className="text-purple-300 disabled:opacity-30 text-xs px-1"
                  onClick={() =>
                    setLocalClub({
                      ...localClub,
                      ranks: normalizeLevels(
                        moveItem(localClub.ranks, i, i - 1),
                      ) as ClubRank[],
                    })
                  }
                >
                  ▲
                </button>
                <button
                  disabled={i === localClub.ranks.length - 1}
                  className="text-purple-300 disabled:opacity-30 text-xs px-1"
                  onClick={() =>
                    setLocalClub({
                      ...localClub,
                      ranks: normalizeLevels(
                        moveItem(localClub.ranks, i, i + 1),
                      ) as ClubRank[],
                    })
                  }
                >
                  ▼
                </button>
              </div>

              <span className="w-8 sm:w-10 text-center font-mono text-purple-300 text-xs sm:text-sm">
                {rank.level}
              </span>
            </div>

            {rank.users.map((u, ui) => (
              <div
                key={ui}
                className="flex justify-between text-xs sm:text-sm text-white"
              >
                <span className="truncate max-w-37.5 sm:max-w-50">{u.srn}</span>
                <button
                  className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                  onClick={() => {
                    const nextClub = {
                      ...localClub,
                      ranks: localClub.ranks.map((r, idx) =>
                        idx === i
                          ? { ...r, users: r.users.filter((_, x) => x !== ui) }
                          : r,
                      ),
                    };

                    if (rank.level === 1 && !isAdmin) {
                      saveAndExit(
                        nextClub,
                        "Removing yourself from club lead will revoke edit access. Continue?",
                        "You are no longer a club lead",
                      );
                      return;
                    }

                    setLocalClub(nextClub);
                    saveWith(nextClub);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}

            <UserSelect
              onPick={(srn) =>
                setLocalClub((prev) => {
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
              className="w-full rounded-lg bg-red-500/20 text-red-300 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-red-500/30 transition"
              onClick={() => {
                if (!confirmAction("Delete this rank?")) return;
                setLocalClub({
                  ...localClub,
                  ranks: normalizeLevels(
                    localClub.ranks.filter((_, x) => x !== i),
                  ) as ClubRank[],
                });
                toast.success("Rank deleted");
              }}
            >
              Delete rank
            </button>
          </div>
        ))}

        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition text-xs sm:text-sm"
          onClick={() =>
            setLocalClub({
              ...localClub,
              ranks: normalizeLevels([
                ...localClub.ranks,
                { name: "", level: localClub.ranks.length + 1, users: [] },
              ]) as ClubRank[],
            })
          }
        >
          + Add rank
        </button>
      </section>

      <section className="space-y-4 sm:space-y-6">
        <h2 className="text-[10px] sm:text-xs uppercase text-purple-300">
          Domains
        </h2>

        {localClub.domains.map((domain, di) => {
          const domainLocked =
            (isDomainLead && !editableDomains.includes(di)) || saving;
          return (
            <div
              key={di}
              className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 space-y-3 sm:space-y-4"
            >
              <input
                className="w-full rounded-lg bg-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                disabled={domainLocked}
                value={domain.name ?? ""}
                onChange={(e) => {
                  const d = [...localClub.domains];
                  d[di].name = e.target.value;
                  setLocalClub({ ...localClub, domains: d });
                }}
                placeholder="Domain name"
              />

              <textarea
                rows={2}
                className="w-full rounded-lg bg-white/10 px-3 sm:px-4 py-2 sm:py-3 text-white text-xs sm:text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                disabled={domainLocked}
                value={domain.description ?? ""}
                onChange={(e) => {
                  const d = [...localClub.domains];
                  d[di].description = e.target.value;
                  setLocalClub({ ...localClub, domains: d });
                }}
                placeholder="Domain description"
              />

              <div
                className={
                  domainLocked ? "opacity-50 pointer-events-none" : "space-y-3"
                }
              >
                {domain.ranks.map((rank, ri) => (
                  <div
                    key={ri}
                    className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-3"
                  >
                    <div className="flex gap-2 items-center">
                      <input
                        className="flex-1 rounded-lg bg-white/10 px-2 sm:px-3 py-2 text-white text-xs sm:text-sm"
                        value={rank.name ?? ""}
                        onChange={(e) => {
                          const d = [...localClub.domains];
                          d[di].ranks[ri].name = e.target.value;
                          setLocalClub({ ...localClub, domains: d });
                        }}
                      />

                      <div className="flex flex-col">
                        <button
                          disabled={ri === 0}
                          className="text-purple-300 disabled:opacity-30 text-xs px-1"
                          onClick={() => {
                            const d = [...localClub.domains];
                            d[di].ranks = normalizeLevels(
                              moveItem(d[di].ranks, ri, ri - 1),
                            ) as DomainRank[];
                            setLocalClub({ ...localClub, domains: d });
                          }}
                        >
                          ▲
                        </button>
                        <button
                          disabled={ri === domain.ranks.length - 1}
                          className="text-purple-300 disabled:opacity-30 text-xs px-1"
                          onClick={() => {
                            const d = [...localClub.domains];
                            d[di].ranks = normalizeLevels(
                              moveItem(d[di].ranks, ri, ri + 1),
                            ) as DomainRank[];
                            setLocalClub({ ...localClub, domains: d });
                          }}
                        >
                          ▼
                        </button>
                      </div>

                      <span className="w-8 sm:w-10 text-center font-mono text-purple-300 text-xs sm:text-sm">
                        {rank.level}
                      </span>
                    </div>

                    {rank.users.map((u, ui) => (
                      <div
                        key={ui}
                        className="flex justify-between text-xs sm:text-sm text-white"
                      >
                        <span className="truncate max-w-37.5 sm:max-w-50">
                          {u.srn}
                        </span>
                        <button
                          className="text-red-400 hover:text-red-300 text-xs sm:text-sm"
                          onClick={() => {
                            const isSelf = u.srn === actualUser.srn;
                            const nextClub = {
                              ...localClub,
                              domains: localClub.domains.map((dom, dIdx) =>
                                dIdx !== di
                                  ? dom
                                  : {
                                      ...dom,
                                      ranks: dom.ranks.map((r, rIdx) =>
                                        rIdx === ri
                                          ? {
                                              ...r,
                                              users: r.users.filter(
                                                (_, x) => x !== ui,
                                              ),
                                            }
                                          : r,
                                      ),
                                    },
                              ),
                            };

                            if (rank.level === 1 && isSelf && !isAdmin) {
                              saveAndExit(
                                nextClub,
                                "Removing yourself from the top domain rank will revoke edit access. Continue?",
                                "You have been removed from the domain lead role",
                              );
                              return;
                            }

                            setLocalClub(nextClub);
                            saveWith(nextClub);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <UserSelect
                      onPick={(srn) => {
                        const d = [...localClub.domains];
                        d[di].ranks[ri].users.push({ srn });
                        setLocalClub({ ...localClub, domains: d });
                      }}
                    />

                    <button
                      className="w-full rounded-lg bg-red-500/20 text-red-300 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-red-500/30 transition"
                      onClick={() => {
                        if (!confirmAction("Delete this domain rank?")) return;
                        const d = [...localClub.domains];
                        d[di].ranks = normalizeLevels(
                          d[di].ranks.filter((_, x) => x !== ri),
                        ) as DomainRank[];
                        setLocalClub({ ...localClub, domains: d });
                        toast.success("Domain rank deleted");
                      }}
                    >
                      Delete rank
                    </button>
                  </div>
                ))}

                <button
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-500/20 text-purple-300 text-xs sm:text-sm hover:bg-purple-500/30 transition"
                  onClick={() => {
                    const d = [...localClub.domains];
                    d[di].ranks = normalizeLevels([
                      ...d[di].ranks,
                      { name: "", level: d[di].ranks.length + 1, users: [] },
                    ]) as DomainRank[];
                    setLocalClub({ ...localClub, domains: d });
                  }}
                >
                  + Add domain rank
                </button>
              </div>

              <button
                className="w-full rounded-lg bg-red-600/30 text-red-300 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-red-600/40 transition disabled:opacity-50"
                disabled={domainLocked}
                onClick={() => {
                  if (!confirmAction("Delete this domain permanently?")) return;
                  setLocalClub({
                    ...localClub,
                    domains: localClub.domains.filter((_, x) => x !== di),
                  });
                  toast.success("Domain deleted");
                }}
              >
                Delete domain
              </button>
            </div>
          );
        })}

        <button
          className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-xs sm:text-sm disabled:opacity-50"
          disabled={isDomainLead || saving}
          onClick={() =>
            setLocalClub({
              ...localClub,
              domains: [
                ...localClub.domains,
                { name: "", description: "", ranks: [] },
              ],
            })
          }
        >
          + Add domain
        </button>
      </section>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2.5 sm:py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>

        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleteClub.isPending}
            className="flex-1 py-2.5 sm:py-3 rounded-xl bg-red-700 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
          >
            {deleteClub.isPending ? "Deleting…" : "Delete Club"}
          </button>
        )}
      </div>
    </div>
  );
}
