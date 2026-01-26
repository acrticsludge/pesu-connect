"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Club } from "@/lib/types/club";

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/clubs/${id}`)
      .then((res) => res.json())
      .then(setClub);
  }, [id]);

  if (!club) {
    return (
      <div className="text-center py-20 text-[#A3A3A3]">Loading club...</div>
    );
  }

  const save = async () => {
    if (club.isRecruiting && !club.recruitingLink?.trim()) {
      alert("Recruitment form link is required when recruiting is enabled");
      return;
    }

    setSaving(true);
    await fetch(`/api/clubs/${id}/edit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(club),
    });
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-white">Edit Club</h1>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-purple-300">Basic Info</h2>

        <input
          placeholder="Club name"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          value={club.name}
          onChange={(e) => setClub({ ...club, name: e.target.value })}
        />

        <textarea
          placeholder="Short description (shown on cards)"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          rows={3}
          value={club.shortDescription || ""}
          onChange={(e) =>
            setClub({ ...club, shortDescription: e.target.value })
          }
        />

        <textarea
          placeholder="Full description (about section)"
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-white/40"
          rows={5}
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-purple-300">
          Staff Coordinator
        </h2>

        <input
          placeholder="Coordinator name"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
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
          placeholder="Department"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-purple-300">Recruitment</h2>

        <label className="flex items-center gap-3 text-white">
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
            placeholder="Recruitment form link"
            className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
            value={club.recruitingLink || ""}
            onChange={(e) =>
              setClub({ ...club, recruitingLink: e.target.value })
            }
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-purple-300">Media</h2>

        <input
          placeholder="Banner image URL"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
          value={club.banner?.url || ""}
          onChange={(e) =>
            setClub({ ...club, banner: { url: e.target.value } })
          }
        />

        <input
          placeholder="Instagram URL"
          className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
          value={club.instagram || ""}
          onChange={(e) => setClub({ ...club, instagram: e.target.value })}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-purple-300">Club Ranks</h2>

        {club.ranks.map((rank, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              placeholder="Rank name"
              className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
              value={rank.name}
              onChange={(e) => {
                const ranks = [...club.ranks];
                ranks[i].name = e.target.value;
                setClub({ ...club, ranks });
              }}
            />
            <input
              type="number"
              placeholder="Level"
              className="w-24 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white"
              value={rank.level}
              onChange={(e) => {
                const ranks = [...club.ranks];
                ranks[i].level = Number(e.target.value);
                setClub({ ...club, ranks });
              }}
            />
            <button
              className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs"
              onClick={() =>
                setClub({
                  ...club,
                  ranks: club.ranks.filter((_, idx) => idx !== i),
                })
              }
            >
              Delete
            </button>
          </div>
        ))}

        <button
          className="w-fit px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
          onClick={() =>
            setClub({
              ...club,
              ranks: [...club.ranks, { name: "", level: 0 }],
            })
          }
        >
          + Add rank
        </button>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-purple-300">Domains</h2>

        {club.domains.map((domain, di) => (
          <div
            key={di}
            className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4"
          >
            <input
              placeholder="Domain name"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
              value={domain.name}
              onChange={(e) => {
                const domains = [...club.domains];
                domains[di].name = e.target.value;
                setClub({ ...club, domains });
              }}
            />

            <textarea
              placeholder="Domain description"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
              rows={2}
              value={domain.description || ""}
              onChange={(e) => {
                const domains = [...club.domains];
                domains[di].description = e.target.value;
                setClub({ ...club, domains });
              }}
            />

            <div className="space-y-2">
              {domain.ranks.map((rank, ri) => (
                <div key={ri} className="flex gap-2 items-center">
                  <input
                    placeholder="Rank name"
                    className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white placeholder:text-white/40"
                    value={rank.name}
                    onChange={(e) => {
                      const domains = [...club.domains];
                      domains[di].ranks[ri].name = e.target.value;
                      setClub({ ...club, domains });
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Level"
                    className="w-24 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-white"
                    value={rank.level}
                    onChange={(e) => {
                      const domains = [...club.domains];
                      domains[di].ranks[ri].level = Number(e.target.value);
                      setClub({ ...club, domains });
                    }}
                  />
                  <button
                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs"
                    onClick={() => {
                      const domains = [...club.domains];
                      domains[di].ranks = domains[di].ranks.filter(
                        (_, idx) => idx !== ri,
                      );
                      setClub({ ...club, domains });
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
                onClick={() => {
                  const domains = [...club.domains];
                  domains[di].ranks.push({ name: "", level: 0 });
                  setClub({ ...club, domains });
                }}
              >
                + Add domain rank
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-sm"
                onClick={() =>
                  setClub({
                    ...club,
                    domains: club.domains.filter((_, idx) => idx !== di),
                  })
                }
              >
                Delete domain
              </button>
            </div>
          </div>
        ))}

        <button
          className="w-fit px-4 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm"
          onClick={() =>
            setClub({
              ...club,
              domains: [
                ...club.domains,
                {
                  name: "",
                  description: "",
                  ranks: [],
                  members: [],
                  domainLeads: [],
                },
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
        {saving ? "Saving..." : "Save Changes"}
      </button>

      <section className="pt-8 border-t border-white/10">
        <button
          className="w-full py-3 rounded-xl bg-red-600 text-white font-semibold"
          onClick={async () => {
            const ok = confirm("Delete this club permanently?");
            if (!ok) return;
            await fetch(`/api/clubs/${id}/edit`, { method: "DELETE" });
            router.push("/");
          }}
        >
          Delete Club
        </button>
      </section>
    </div>
  );
}
