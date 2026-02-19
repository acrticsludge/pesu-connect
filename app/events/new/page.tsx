"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { useUser } from "@/lib/hooks/useUser";
import { useClubs } from "@/lib/hooks/useClubs";
import { useCreateEvent } from "@/lib/hooks/useCreateEvent";
import { useQueryClient } from "@tanstack/react-query";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const CATEGORIES = ["TECHNICAL", "CULTURAL", "SPORTS"] as const;
const TAGS = [
  "WORKSHOP",
  "HACKATHON",
  "SEMINAR",
  "COMPETITION",
  "MEETUP",
  "OTHER",
] as const;
const CAMPUS = ["RR", "EC"] as const;

export default function NewEventPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: clubs = [], isLoading: clubsLoading } = useClubs();

  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    bannerUrl: "",
    involvedClubs: [] as { club: string; domains: string[] }[],
    categories: [] as string[],
    tags: [] as string[],
    registration: {
      isRegister: false,
      deadline: "",
      link: "",
      methodText: "",
    },
    startDate: "",
    endDate: "",
    venue: "",
    campus: "RR" as "RR" | "EC",
    isPinned: false,
  });
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["clubs"] });
  }, []);
  if (userLoading || clubsLoading) {
    return <div className="text-center py-20 text-[#A3A3A3]">Loading...</div>;
  }

  if (!user) {
    router.replace("/");
    return null;
  }

  const isAdmin = user.role === "admin";
  const createEvent = useCreateEvent(isAdmin);
  const canCreate =
    isAdmin ||
    clubs.some((club) => {
      if (!club.ranks?.length) return false;
      const max = Math.max(...club.ranks.map((r) => r.level));
      return club.ranks
        .filter((r) => r.level === max)
        .some((r) => r.users?.some((u) => u.srn === user.srn));
    });

  if (!canCreate) {
    toast.error("You are not authorized to create events");
    router.replace("/dashboard");
    return null;
  }

  const addClub = () => {
    setForm((prev) => ({
      ...prev,
      involvedClubs: [...prev.involvedClubs, { club: "", domains: [] }],
    }));
  };

  const updateClub = (index: number, clubId: string) => {
    setForm((prev) => {
      const next = [...prev.involvedClubs];
      next[index] = { club: clubId, domains: [] };
      return { ...prev, involvedClubs: next };
    });
  };

  const updateDomains = (index: number, domains: string[]) => {
    setForm((prev) => {
      const next = [...prev.involvedClubs];
      next[index] = { ...next[index], domains };
      return { ...prev, involvedClubs: next };
    });
  };

  const toggleMulti = (key: "categories" | "tags", value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Event name is required";
    if (!form.shortDescription.trim()) return "Short description is required";
    if (!form.fullDescription.trim()) return "Full description is required";
    if (!form.startDate || !form.endDate) return "Event dates are required";
    if (!form.venue.trim()) return "Venue is required";
    if (form.categories.length === 0) return "Select at least one category";
    if (form.tags.length === 0) return "Select at least one tag";
    if (form.involvedClubs.length === 0)
      return "At least one involved club is required";
    if (form.involvedClubs.some((c) => !c.club || c.domains.length === 0)) {
      return "Select club and domains for all entries";
    }
    if (!form.bannerUrl.trim()) return "Banner URL is required";
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    createEvent.mutate(
      {
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registration: {
          ...form.registration,
          deadline: form.registration.deadline
            ? new Date(form.registration.deadline).toISOString()
            : undefined,
        },
      },
      {
        onSuccess: (data) => {
          router.push(isAdmin ? `/events/${data._id}` : "/dashboard");
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8 text-white overflow-x-hidden">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Event</h1>
        <p className="text-sm text-white/60">
          {isAdmin
            ? "Fill in the details below to create a new event."
            : "Fill in the details below to request a new event. It will be reviewed by an admin."}
        </p>
      </div>

      <Field label="Event Name">
        <Input
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Short Description">
        <Textarea
          rows={3}
          value={form.shortDescription}
          onChange={(v) => setForm({ ...form, shortDescription: v })}
          placeholder="Brief overview of the event (max 160 characters)"
          maxLength={160}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Full Description">
        <div className="w-full rounded-xl bg-white/10 px-3 sm:px-4 py-3">
          <ReactQuill
            value={form.fullDescription}
            onChange={(html) =>
              setForm((prev) => ({ ...prev, fullDescription: html }))
            }
            placeholder="Describe the event in detail..."
            theme="snow"
            readOnly={createEvent.isPending}
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
      </Field>

      <Field label="Banner Image URL">
        <Input
          placeholder="https://example.com/banner.jpg"
          value={form.bannerUrl}
          onChange={(v) => setForm({ ...form, bannerUrl: v })}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Categories">
        <ChipGroup
          values={CATEGORIES}
          selected={form.categories}
          onToggle={(v) => toggleMulti("categories", v)}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Tags">
        <ChipGroup
          values={TAGS}
          selected={form.tags}
          onToggle={(v) => toggleMulti("tags", v)}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Campus">
        <div className="flex flex-wrap gap-2">
          {CAMPUS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, campus: c })}
              disabled={createEvent.isPending}
              className={`px-3 py-1 rounded-full text-sm border transition active:scale-95 ${
                form.campus === c
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : "border-white/20 text-white/80 hover:border-white/40"
              } disabled:opacity-50`}
            >
              {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Involved Clubs & Domains">
        <div className="space-y-4">
          {form.involvedClubs.map((entry, i) => {
            const club = clubs.find((c) => c._id === entry.club);
            return (
              <div
                key={i}
                className="space-y-3 p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-white font-medium text-sm">
                    Club {i + 1}
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        involvedClubs: prev.involvedClubs.filter(
                          (_, idx) => idx !== i,
                        ),
                      }))
                    }
                    disabled={createEvent.isPending}
                    className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>

                <select
                  value={entry.club}
                  onChange={(e) => updateClub(i, e.target.value)}
                  disabled={createEvent.isPending}
                  className="w-full rounded-xl bg-[#1a1a2e] px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                >
                  <option
                    value=""
                    disabled
                    className="bg-[#1a1a2e] text-white/60"
                  >
                    Select a club
                  </option>
                  {clubs.map((c) => (
                    <option
                      key={c._id}
                      value={c._id}
                      className="bg-[#1a1a2e] text-white"
                    >
                      {c.name}
                    </option>
                  ))}
                </select>

                {club && (
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">
                      Domains <span className="text-red-400">*</span>
                    </label>
                    {entry.domains.length > 0 && (
                      <div className="mb-3 p-2 bg-purple-500/10 rounded-lg">
                        <p className="text-xs text-white/60 mb-2">Selected:</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.domains.map((domain) => (
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
                    <select
                      multiple
                      value={entry.domains}
                      onChange={(e) =>
                        updateDomains(
                          i,
                          Array.from(e.target.selectedOptions).map(
                            (o) => o.value,
                          ),
                        )
                      }
                      disabled={createEvent.isPending}
                      className="w-full h-40 rounded-xl bg-[#1a1a2e] px-4 py-2 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                    >
                      {club.domains?.map((d) => (
                        <option
                          key={d.name}
                          value={d.name}
                          className="bg-[#1a1a2e] text-white"
                        >
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-white/40 mt-1">
                      Hold Ctrl/Cmd to select multiple domains
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addClub}
            disabled={createEvent.isPending}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-sm active:scale-95 disabled:opacity-50"
          >
            + Add another club
          </button>

          {form.involvedClubs.length === 0 && (
            <p className="text-sm text-yellow-400/70 bg-yellow-400/10 rounded-lg p-4">
              At least one involved club is required.
            </p>
          )}
        </div>
      </Field>

      <Field label="Event Dates">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/60 mb-1 block">
              Start Date
            </label>
            <Input
              type="datetime-local"
              value={form.startDate}
              onChange={(v) => setForm({ ...form, startDate: v })}
              disabled={createEvent.isPending}
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">End Date</label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(v) => setForm({ ...form, endDate: v })}
              disabled={createEvent.isPending}
            />
          </div>
        </div>
      </Field>

      <Field label="Venue">
        <Input
          value={form.venue}
          onChange={(v) => setForm({ ...form, venue: v })}
          disabled={createEvent.isPending}
        />
      </Field>

      <Field label="Registration">
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-white text-sm">
            <input
              type="checkbox"
              checked={form.registration.isRegister}
              onChange={(e) =>
                setForm({
                  ...form,
                  registration: {
                    ...form.registration,
                    isRegister: e.target.checked,
                    ...(e.target.checked
                      ? {}
                      : { deadline: "", link: "", methodText: "" }),
                  },
                })
              }
              disabled={createEvent.isPending}
              className="w-4 h-4 accent-purple-500"
            />
            Registration required
          </label>

          {form.registration.isRegister && (
            <div className="space-y-4 pl-4 sm:pl-6 border-l-2 border-purple-500/30">
              <div>
                <label className="text-xs text-white/60 mb-1 block">
                  Registration Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
                  value={form.registration.deadline}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      registration: {
                        ...form.registration,
                        deadline: e.target.value,
                      },
                    })
                  }
                  disabled={createEvent.isPending}
                />
              </div>
              <Input
                placeholder="Registration link (optional)"
                value={form.registration.link}
                onChange={(v) =>
                  setForm({
                    ...form,
                    registration: { ...form.registration, link: v },
                  })
                }
                disabled={createEvent.isPending}
              />
              <Textarea
                rows={2}
                placeholder="Registration instructions (optional)"
                value={form.registration.methodText}
                onChange={(v) =>
                  setForm({
                    ...form,
                    registration: { ...form.registration, methodText: v },
                  })
                }
                disabled={createEvent.isPending}
              />
            </div>
          )}
        </div>
      </Field>

      {isAdmin && (
        <Field label="Admin Controls">
          <label className="flex items-center gap-3 text-white text-sm">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
              disabled={createEvent.isPending}
              className="w-4 h-4 accent-purple-500"
            />
            Pin this event
          </label>
        </Field>
      )}

      <button
        onClick={handleSubmit}
        disabled={createEvent.isPending}
        className="w-full mt-6 px-6 py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
      >
        {createEvent.isPending
          ? "Submitting..."
          : isAdmin
            ? "Create Event"
            : "Send for Approval"}
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs sm:text-sm uppercase text-purple-300">{label}</p>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
    />
  );
}

function Textarea({
  rows,
  value,
  onChange,
  placeholder,
  maxLength,
  disabled,
}: {
  rows: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none disabled:opacity-50"
    />
  );
}

function ChipGroup({
  values,
  selected,
  onToggle,
  disabled,
}: {
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onToggle(v)}
          disabled={disabled}
          className={`px-3 py-1 rounded-full text-xs sm:text-sm border transition active:scale-95 ${
            selected.includes(v)
              ? "bg-[#7C3AED] border-[#7C3AED] text-white"
              : "border-white/20 text-white/80 hover:border-white/40"
          } disabled:opacity-50`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
