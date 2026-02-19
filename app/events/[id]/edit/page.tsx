"use client";

import { useParams, useRouter } from "next/navigation";
import { BaseEventData, EventCategory, EventTag } from "@/lib/types/event";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { useUser } from "@/lib/hooks/useUser";
import { useClubs } from "@/lib/hooks/useClubs";
import { useEvent } from "@/lib/hooks/useEvents";
import { useUpdateEvent } from "@/lib/hooks/useUpdateEvent";
import { useState, useMemo } from "react";
import { useDeleteEvent } from "@/lib/hooks/useDeleteEvent";

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

  const { data: user } = useUser();
  const { data: clubs = [], isLoading: clubsLoading } = useClubs();
  const { data: event, isLoading: eventLoading } = useEvent(id);
  const updateEvent = useUpdateEvent(id);
  const deleteEvent = useDeleteEvent(id);

  const [localEvent, setLocalEvent] = useState<BaseEventData | null>(null);

  useMemo(() => {
    if (event) {
      const normalizedInvolvedClubs = (event.involvedClubs || []).map(
        (ic: any) => ({
          club: typeof ic.club === "object" ? ic.club._id : ic.club,
          domains: ic.domains || [],
        }),
      );

      setLocalEvent({
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        registration: event.registration || {
          isRegister: false,
          deadline: undefined,
          link: "",
          methodText: "",
        },
        involvedClubs: normalizedInvolvedClubs,
      });
    }
  }, [event]);

  if (eventLoading || clubsLoading || !localEvent) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
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
    const updated = { ...localEvent };
    if (field === "club") {
      updated.involvedClubs[index].club = value;
      updated.involvedClubs[index].domains = [];
    } else {
      updated.involvedClubs[index].domains = value;
    }
    setLocalEvent(updated);
  };

  const addInvolvedClub = () => {
    setLocalEvent({
      ...localEvent,
      involvedClubs: [...localEvent.involvedClubs, { club: "", domains: [] }],
    });
  };

  const removeInvolvedClub = (index: number) => {
    setLocalEvent({
      ...localEvent,
      involvedClubs: localEvent.involvedClubs.filter((_, i) => i !== index),
    });
  };

  const handleCategoryToggle = (category: EventCategory) => {
    const current = localEvent.categories || [];
    const updated = current.includes(category)
      ? current.filter((c) => c !== category)
      : [...current, category];
    setLocalEvent({ ...localEvent, categories: updated });
  };

  const handleTagToggle = (tag: EventTag) => {
    const current = localEvent.tags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setLocalEvent({ ...localEvent, tags: updated });
  };

  const validateInvolvedClubs = () => {
    for (const [index, ic] of localEvent.involvedClubs.entries()) {
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

  const handleSave = async () => {
    if (updateEvent.isPending) return;

    if (!localEvent.name?.trim()) {
      toast.error("Event name is required");
      return;
    }
    if (!localEvent.venue?.trim()) {
      toast.error("Venue is required");
      return;
    }
    if (!localEvent.campus) {
      toast.error("Campus is required");
      return;
    }
    if (!localEvent.startDate || !localEvent.endDate) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(localEvent.startDate) >= new Date(localEvent.endDate)) {
      toast.error("End date must be after start date");
      return;
    }
    if (
      localEvent.registration?.isRegister &&
      !localEvent.registration.deadline
    ) {
      toast.error("Registration deadline is required");
      return;
    }
    if (!validateInvolvedClubs()) {
      return;
    }

    updateEvent.mutate(localEvent, {
      onSuccess: () => {
        setTimeout(() => {
          router.push(`/events/${localEvent._id}`);
        }, 100);
      },
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this event permanently?")) return;
    deleteEvent.mutate(undefined, {
      onSuccess: () => {
        router.push("/events");
      },
    });
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
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 space-y-8 sm:space-y-12 overflow-x-hidden">
      <nav className="text-sm text-white/50 flex flex-wrap items-center gap-1">
        <span
          className="cursor-pointer hover:text-white transition"
          onClick={() => router.push("/events")}
        >
          Events
        </span>
        <span>›</span>
        <span
          className="cursor-pointer hover:text-white truncate max-w-37.5 sm:max-w-xs transition"
          onClick={() => router.push(`/events/${localEvent._id}`)}
        >
          {localEvent.name}
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
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
          value={localEvent.name ?? ""}
          onChange={(e) =>
            setLocalEvent({ ...localEvent, name: e.target.value })
          }
          placeholder="Event name"
          disabled={updateEvent.isPending}
        />

        <textarea
          rows={2}
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
          value={localEvent.shortDescription ?? ""}
          onChange={(e) =>
            setLocalEvent({ ...localEvent, shortDescription: e.target.value })
          }
          placeholder="Short description (max 160 characters)"
          maxLength={160}
          disabled={updateEvent.isPending}
        />

        <div className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-3">
          <ReactQuill
            value={localEvent.fullDescription ?? ""}
            onChange={(html) =>
              setLocalEvent({ ...localEvent, fullDescription: html })
            }
            placeholder="Full event description"
            theme="snow"
            readOnly={updateEvent.isPending}
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
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
              value={
                localEvent.startDate &&
                !isNaN(new Date(localEvent.startDate).getTime())
                  ? new Date(localEvent.startDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setLocalEvent({
                  ...localEvent,
                  startDate: new Date(e.target.value),
                })
              }
              disabled={updateEvent.isPending}
            />
          </div>
          <div>
            <label className="text-xs sm:text-sm text-white/60 mb-1 block">
              End Date
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
              value={
                localEvent.endDate &&
                !isNaN(new Date(localEvent.endDate).getTime())
                  ? new Date(localEvent.endDate).toISOString().slice(0, 16)
                  : ""
              }
              onChange={(e) =>
                setLocalEvent({
                  ...localEvent,
                  endDate: new Date(e.target.value),
                })
              }
              disabled={updateEvent.isPending}
            />
          </div>
        </div>

        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
          value={localEvent.venue ?? ""}
          onChange={(e) =>
            setLocalEvent({ ...localEvent, venue: e.target.value })
          }
          placeholder="Venue"
          disabled={updateEvent.isPending}
        />

        <div className="flex flex-wrap gap-4">
          {CAMPUSES.map((c) => (
            <label
              key={c}
              className="flex items-center gap-2 text-white text-sm sm:text-base cursor-pointer"
            >
              <input
                type="radio"
                name="campus"
                value={c}
                checked={localEvent.campus === c}
                onChange={(e) =>
                  setLocalEvent({
                    ...localEvent,
                    campus: e.target.value as "EC" | "RR",
                  })
                }
                disabled={updateEvent.isPending}
                className="cursor-pointer"
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
                className="flex items-center gap-2 text-white text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localEvent.categories?.includes(cat) ?? false}
                  onChange={() => handleCategoryToggle(cat)}
                  disabled={updateEvent.isPending}
                  className="cursor-pointer"
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
                className="flex items-center gap-2 text-white text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localEvent.tags?.includes(tag) ?? false}
                  onChange={() => handleTagToggle(tag)}
                  disabled={updateEvent.isPending}
                  className="cursor-pointer"
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
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
          value={localEvent.bannerUrl ?? ""}
          onChange={(e) =>
            setLocalEvent({ ...localEvent, bannerUrl: e.target.value })
          }
          placeholder="Banner image URL"
          disabled={updateEvent.isPending}
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-xs sm:text-sm uppercase text-purple-300">
            Involved Clubs
          </h2>
          {localEvent.involvedClubs.length > 0 && (
            <span className="text-xs text-red-400">
              * Domains are mandatory
            </span>
          )}
        </div>

        {localEvent.involvedClubs.map((ic, index) => {
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
                  disabled={updateEvent.isPending}
                  className="text-red-400 hover:text-red-300 transition text-sm disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <select
                className="w-full rounded-lg bg-[#1a1a2e] px-3 py-3 text-white border border-white/10 text-sm focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                value={clubId ?? ""}
                onChange={(e) =>
                  handleInvolvedClubChange(index, "club", e.target.value)
                }
                disabled={updateEvent.isPending}
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
                        className="w-full rounded-lg bg-[#1a1a2e] px-3 py-3 text-white border border-white/10 min-h-30 text-sm focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                        value={ic.domains ?? []}
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
                        disabled={updateEvent.isPending}
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
          disabled={updateEvent.isPending}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-sm active:scale-95 disabled:opacity-50"
        >
          + Add involved club
        </button>

        {localEvent.involvedClubs.length === 0 && (
          <p className="text-sm text-yellow-400/70 bg-yellow-400/10 rounded-lg p-4">
            At least one involved club is required.
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xs sm:text-sm uppercase text-purple-300">
          Registration
        </h2>

        <label className="flex items-center gap-3 text-white text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={localEvent.registration?.isRegister ?? false}
            onChange={(e) =>
              setLocalEvent({
                ...localEvent,
                registration: {
                  ...localEvent.registration,
                  isRegister: e.target.checked,
                  ...(e.target.checked
                    ? {}
                    : { deadline: undefined, link: "", methodText: "" }),
                },
              })
            }
            disabled={updateEvent.isPending}
            className="cursor-pointer"
          />
          Enable Registration
        </label>

        {localEvent.registration?.isRegister && (
          <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-purple-500/30">
            <div>
              <label className="text-xs sm:text-sm text-white/60 mb-1 block">
                Registration Deadline <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                value={
                  localEvent.registration.deadline &&
                  !isNaN(new Date(localEvent.registration.deadline).getTime())
                    ? new Date(localEvent.registration.deadline)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setLocalEvent({
                    ...localEvent,
                    registration: {
                      ...localEvent.registration,
                      deadline: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    },
                  })
                }
                disabled={updateEvent.isPending}
              />
            </div>

            <input
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
              value={localEvent.registration.link ?? ""}
              onChange={(e) =>
                setLocalEvent({
                  ...localEvent,
                  registration: {
                    ...localEvent.registration,
                    link: e.target.value,
                  },
                })
              }
              placeholder="Registration link"
              disabled={updateEvent.isPending}
            />

            <textarea
              rows={2}
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
              value={localEvent.registration.methodText ?? ""}
              onChange={(e) =>
                setLocalEvent({
                  ...localEvent,
                  registration: {
                    ...localEvent.registration,
                    methodText: e.target.value,
                  },
                })
              }
              placeholder="Registration instructions"
              disabled={updateEvent.isPending}
            />
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <h2 className="text-xs sm:text-sm uppercase text-purple-300">
            Admin Controls
          </h2>

          <label className="flex items-center gap-3 text-white text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={localEvent.isPinned ?? false}
              onChange={(e) =>
                setLocalEvent({ ...localEvent, isPinned: e.target.checked })
              }
              disabled={updateEvent.isPending}
              className="cursor-pointer"
            />
            Pin this event
          </label>
        </section>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={updateEvent.isPending}
          className="flex-1 py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
        >
          {updateEvent.isPending ? "Saving…" : "Save Changes"}
        </button>

        {isAdmin && (
          <button
            onClick={handleDelete}
            disabled={deleteEvent.isPending}
            className="flex-1 py-3 rounded-xl bg-red-700 text-white font-semibold hover:bg-red-600 transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
          >
            {deleteEvent.isPending ? "Deleting…" : "Delete Event"}
          </button>
        )}
      </div>
    </div>
  );
}
