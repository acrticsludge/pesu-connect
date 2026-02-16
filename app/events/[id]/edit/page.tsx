"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BaseEventData, EventCategory, EventTag } from "@/lib/types/event";

import toast from "react-hot-toast";

import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

const CATEGORIES: EventCategory[] = ["TECHNICAL", "CULTURAL", "SPORTS"];
const TAGS: EventTag[] = [
  "WORKSHOP",
  "HACKATHON",
  "SEMINAR",
  "COMPETITION",
  "MEETUP",
  "OTHER",
];
const CAMPUSES = ["EC", "RR"] as const;

interface ClubData {
  _id: string;
  name: string;
  domains: Array<{
    name: string;
    description?: string;
    ranks?: any[];
  }>;
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [event, setEvent] = useState<BaseEventData | null>(null);
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [clubsLoaded, setClubsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data);
        setIsAdmin(data?.user?.role === "admin");
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/clubs").then((r) => r.json()),
      id
        ? fetch(`/api/events/${id}`).then((r) => r.json())
        : Promise.resolve(null),
    ])
      .then(([clubsData, eventData]) => {
        setClubs(clubsData || []);
        setClubsLoaded(true);

        if (eventData?.event) {
          const e = eventData.event;
          const normalizedInvolvedClubs = (e.involvedClubs || []).map(
            (ic: any) => ({
              club: typeof ic.club === "object" ? ic.club._id : ic.club,
              domains: ic.domains || [],
            }),
          );

          setEvent({
            ...e,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            registration: e.registration || {
              isRegister: false,
              deadline: undefined,
              link: "",
              methodText: "",
            },
            involvedClubs: normalizedInvolvedClubs,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load data");
        setLoading(false);
      });
  }, [id]);

  if (loading || !user || !clubsLoaded) {
    return <div className="py-24 text-center text-white/60">Loading…</div>;
  }

  if (!event) {
    return (
      <div className="py-24 text-center text-red-400">Event not found</div>
    );
  }

  const canEdit = isAdmin;

  if (!canEdit) {
    return (
      <div className="py-24 text-center text-red-400">
        You do not have permission to edit this event.
      </div>
    );
  }

  const handleInvolvedClubChange = (
    index: number,
    field: "club" | "domains",
    value: any,
  ) => {
    const updated = { ...event };
    if (field === "club") {
      updated.involvedClubs[index].club = value;
      updated.involvedClubs[index].domains = [];
    } else {
      updated.involvedClubs[index].domains = value;
    }
    setEvent(updated);
  };

  const addInvolvedClub = () => {
    setEvent({
      ...event,
      involvedClubs: [...event.involvedClubs, { club: "", domains: [] }],
    });
  };

  const removeInvolvedClub = (index: number) => {
    setEvent({
      ...event,
      involvedClubs: event.involvedClubs.filter((_, i) => i !== index),
    });
  };

  const handleCategoryToggle = (category: EventCategory) => {
    const current = event.categories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setEvent({ ...event, categories: updated });
  };

  const handleTagToggle = (tag: EventTag) => {
    const current = event.tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setEvent({ ...event, tags: updated });
  };

  const validateInvolvedClubs = () => {
    for (const [index, ic] of event.involvedClubs.entries()) {
      if (!ic.club) {
        toast.error(`Club ${index + 1}: Please select a club`);
        return false;
      }
      if (!ic.domains || ic.domains.length === 0) {
        toast.error(`Club ${index + 1}: Please select at least one domain`);
        return false;
      }
    }
    return true;
  };

  const save = async () => {
    if (!event.name?.trim()) {
      toast.error("Event name is required");
      return;
    }
    if (!event.venue?.trim()) {
      toast.error("Venue is required");
      return;
    }
    if (!event.campus) {
      toast.error("Campus is required");
      return;
    }
    if (!event.startDate || !event.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(event.startDate) >= new Date(event.endDate)) {
      toast.error("End date must be after start date");
      return;
    }
    if (event.registration?.isRegister && !event.registration.deadline) {
      toast.error("Registration deadline is required");
      return;
    }
    if (!validateInvolvedClubs()) {
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving changes…");

    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save", { id: toastId });
        return;
      }

      toast.success("Event updated successfully", { id: toastId });
      router.refresh();
      router.push(`/events/${id}`);
    } catch {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const getClubDomains = (clubId: string) => {
    if (!clubId) return [];
    const clubIdStr = typeof clubId === "object" ? (clubId as any)._id : clubId;
    const selectedClub = clubs.find((c) => c._id === clubIdStr);
    return selectedClub?.domains || [];
  };

  const getClubName = (clubId: string) => {
    if (!clubId) return "Not Selected";
    const clubIdStr = typeof clubId === "object" ? (clubId as any)._id : clubId;
    const club = clubs.find((c) => c._id === clubIdStr);
    return club?.name || "Unknown Club";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-12">
      <nav className="text-sm text-white/50 flex flex-wrap items-center gap-1">
        <span
          className="cursor-pointer hover:text-white"
          onClick={() => router.push("/events")}
        >
          Events
        </span>
        <span>›</span>
        <span
          className="cursor-pointer hover:text-white truncate max-w-[150px] sm:max-w-xs"
          onClick={() => router.push(`/events/${event._id}`)}
        >
          {event.name}
        </span>
        <span>›</span>
        <span className="text-white">Edit</span>
      </nav>

      <h1 className="text-xl sm:text-2xl font-bold text-white">Edit Event</h1>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">
          Basic Information
        </h2>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
          value={event.name}
          onChange={(e) => setEvent({ ...event, name: e.target.value })}
          placeholder="Event name"
        />

        <textarea
          rows={2}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
          value={event.shortDescription || ""}
          onChange={(e) =>
            setEvent({ ...event, shortDescription: e.target.value })
          }
          placeholder="Short description (max 160 characters)"
          maxLength={160}
        />

        <div className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-3">
          <ReactQuill
            value={event.fullDescription || ""}
            onChange={(html) => setEvent({ ...event, fullDescription: html })}
            placeholder="Full event description"
            theme="snow"
            modules={{
              toolbar: [
                ["bold", "italic", "underline"],
                [{ header: [2, 3, false] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["clean"],
              ],
            }}
            className="text-white [&_.ql-editor]:min-h-40 [&_.ql-editor]:text-sm sm:[&_.ql-editor]:text-base [&_.ql-editor]:text-white [&_.ql-container]:bg-transparent [&_.ql-toolbar]:bg-transparent [&_.ql-toolbar]:border-white/10 [&_.ql-toolbar_.ql-stroke]:stroke-white [&_.ql-toolbar_.ql-fill]:fill-white"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">
          Date & Venue
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs sm:text-sm text-white/60 mb-1 block">
              Start Date
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
              value={
                event.startDate
                  ? new Date(event.startDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEvent({ ...event, startDate: new Date(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-white/60 mb-1 block">
              End Date
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
              value={
                event.endDate
                  ? new Date(event.endDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setEvent({ ...event, endDate: new Date(e.target.value) })
              }
            />
          </div>
        </div>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
          value={event.venue || ""}
          onChange={(e) => setEvent({ ...event, venue: e.target.value })}
          placeholder="Venue"
        />

        <div className="flex flex-wrap gap-4">
          {CAMPUSES.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 text-white text-sm sm:text-base"
            >
              <input
                type="radio"
                name="campus"
                value={c}
                checked={event.campus === c}
                onChange={(e) =>
                  setEvent({ ...event, campus: e.target.value as "EC" | "RR" })
                }
              />
              {c}
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">
          Categories & Tags
        </h2>

        <div>
          <h3 className="text-white/80 mb-2 text-sm">Categories</h3>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 text-white text-sm"
              >
                <input
                  type="checkbox"
                  checked={event.categories?.includes(cat)}
                  onChange={() => handleCategoryToggle(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white/80 mb-2 text-sm">Tags</h3>
          <div className="flex flex-wrap gap-3">
            {TAGS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 text-white text-sm"
              >
                <input
                  type="checkbox"
                  checked={event.tags?.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">Banner</h2>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base"
          value={event.bannerUrl || ""}
          onChange={(e) => setEvent({ ...event, bannerUrl: e.target.value })}
          placeholder="Banner image URL"
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xs sm:text-sm uppercase text-purple-300">
            Involved Clubs
          </h2>
          {event.involvedClubs.length > 0 && (
            <span className="text-xs text-red-400">
              * Domains are mandatory
            </span>
          )}
        </div>

        {event.involvedClubs.map((ic, index) => {
          const clubId = ic.club;
          const clubDomains = getClubDomains(clubId);
          const hasError = clubId && (!ic.domains || ic.domains.length === 0);

          return (
            <div
              key={index}
              className={`rounded-xl bg-white/5 border p-4 space-y-3 ${
                hasError ? "border-red-500/50" : "border-white/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-white font-medium text-sm sm:text-base">
                    Club {index + 1}
                  </h3>
                  {clubId && (
                    <p className="text-xs text-purple-300 mt-1">
                      {getClubName(clubId)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeInvolvedClub(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>

              <select
                className="w-full rounded-lg bg-[#1a1a2e] px-3 py-3 text-white border border-white/10 text-sm"
                value={clubId || ""}
                onChange={(e) =>
                  handleInvolvedClubChange(index, "club", e.target.value)
                }
              >
                <option
                  value=""
                  disabled
                  className="bg-[#1a1a2e] text-white/60"
                >
                  Select a club
                </option>
                {clubs.map((club) => (
                  <option
                    key={club._id}
                    value={club._id}
                    className="bg-[#1a1a2e] text-white"
                  >
                    {club.name}
                  </option>
                ))}
              </select>

              {clubId && (
                <div>
                  <label className="text-sm text-white/60 mb-1 block">
                    Domains <span className="text-red-400">*</span>
                  </label>

                  {ic.domains && ic.domains.length > 0 && (
                    <div className="mb-3 p-2 bg-purple-500/10 rounded-lg">
                      <p className="text-xs text-white/60 mb-2">Selected:</p>
                      <div className="flex flex-wrap gap-2">
                        {ic.domains.map((domain) => (
                          <span
                            key={domain}
                            className="px-2 py-1 rounded-full text-xs bg-purple-500/30 text-purple-200"
                          >
                            {domain}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {clubDomains.length > 0 ? (
                    <>
                      <select
                        multiple
                        className="w-full rounded-lg bg-[#1a1a2e] px-3 py-3 text-white border border-white/10 min-h-30 text-sm"
                        value={ic.domains || []}
                        onChange={(e) =>
                          handleInvolvedClubChange(
                            index,
                            "domains",
                            Array.from(
                              e.target.selectedOptions,
                              (opt) => opt.value,
                            ),
                          )
                        }
                      >
                        {clubDomains.map((domain) => (
                          <option
                            key={domain.name}
                            value={domain.name}
                            className="bg-[#1a1a2e] text-white"
                          >
                            {domain.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-white/40 mt-1">
                        Hold Ctrl/Cmd to select multiple
                      </p>

                      {(!ic.domains || ic.domains.length === 0) && (
                        <p className="text-xs text-red-400 mt-2">
                          Please select at least one domain
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-yellow-400/70 bg-yellow-400/10 rounded-lg p-3">
                      This club has no domains defined.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={addInvolvedClub}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-sm"
        >
          + Add involved club
        </button>

        {event.involvedClubs.length === 0 && (
          <p className="text-sm text-yellow-400/70 bg-yellow-400/10 rounded-lg p-4">
            At least one involved club is required.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">
          Registration
        </h2>

        <label className="flex items-center gap-3 text-white text-sm">
          <input
            type="checkbox"
            checked={event.registration?.isRegister}
            onChange={(e) =>
              setEvent({
                ...event,
                registration: {
                  ...event.registration,
                  isRegister: e.target.checked,
                  ...(e.target.checked
                    ? {}
                    : { deadline: undefined, link: "", methodText: "" }),
                },
              })
            }
          />
          Enable Registration
        </label>

        {event.registration?.isRegister && (
          <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-purple-500/30">
            <div>
              <label className="text-xs sm:text-sm text-white/60 mb-1 block">
                Registration Deadline <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm"
                value={
                  event.registration.deadline
                    ? new Date(event.registration.deadline)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEvent({
                    ...event,
                    registration: {
                      ...event.registration,
                      deadline: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
              />
            </div>

            <input
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm"
              value={event.registration.link || ""}
              onChange={(e) =>
                setEvent({
                  ...event,
                  registration: {
                    ...event.registration,
                    link: e.target.value,
                  },
                })
              }
              placeholder="Registration link"
            />

            <textarea
              rows={2}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm"
              value={event.registration.methodText || ""}
              onChange={(e) =>
                setEvent({
                  ...event,
                  registration: {
                    ...event.registration,
                    methodText: e.target.value,
                  },
                })
              }
              placeholder="Registration instructions"
            />
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xs sm:text-sm uppercase text-purple-300">
            Admin Controls
          </h2>

          <label className="flex items-center gap-3 text-white text-sm">
            <input
              type="checkbox"
              checked={event.isPinned || false}
              onChange={(e) =>
                setEvent({ ...event, isPinned: e.target.checked })
              }
            />
            Pin this event
          </label>
        </section>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 text-sm sm:text-base"
      >
        {saving ? "Saving…" : "Save Changes"}
      </button>

      {isAdmin && (
        <button
          onClick={async () => {
            if (!window.confirm("Delete this event permanently?")) return;
            const toastId = toast.loading("Deleting event…");
            try {
              const res = await fetch(`/api/events/${id}`, {
                method: "DELETE",
              });
              if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Failed to delete", { id: toastId });
                return;
              }
              toast.success("Event deleted", { id: toastId });
              router.push("/events");
            } catch {
              toast.error("Something went wrong", { id: toastId });
            }
          }}
          className="w-full py-3 rounded-xl bg-red-700 text-white font-semibold hover:bg-red-600 transition text-sm sm:text-base"
        >
          Delete Event
        </button>
      )}
    </div>
  );
}
