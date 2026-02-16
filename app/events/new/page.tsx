/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
});

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

  const [user, setUser] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    shortDescription: "",
    fullDescription: "",
    bannerUrl: "",

    involvedClubs: [] as {
      club: string;
      domains: string[];
    }[],

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
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/clubs").then((r) => r.json()),
    ]).then(([me, clubs]) => {
      if (!me.user) {
        router.replace("/");
        return;
      }

      const user = me.user;

      if (user.role !== "admin") {
        const isHead = clubs.some((club: any) => {
          if (!club.ranks?.length) return false;
          const max = Math.max(...club.ranks.map((r: any) => r.level));
          return club.ranks
            .filter((r: any) => r.level === max)
            .some((r: any) => r.users?.some((u: any) => u.srn === user.srn));
        });

        if (!isHead) {
          toast.error("You are not authorized to create events");
          router.replace("/dashboard");
          return;
        }
      }

      setUser(user);
      setClubs(clubs);
      setLoading(false);
    });
  }, [router]);

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

  const submit = async () => {
    if (submitting) return;

    if (!form.name.trim()) return toast.error("Event name is required");
    if (!form.shortDescription.trim())
      return toast.error("Short description is required");
    if (!form.fullDescription.trim())
      return toast.error("Full description is required");
    if (!form.startDate || !form.endDate)
      return toast.error("Event dates are required");
    if (!form.venue.trim()) return toast.error("Venue is required");
    if (form.categories.length === 0)
      return toast.error("Select at least one category");
    if (form.tags.length === 0) return toast.error("Select at least one tag");
    if (
      form.involvedClubs.length === 0 ||
      form.involvedClubs.some((c) => !c.club || c.domains.length === 0)
    )
      return toast.error("Select club and domains");
    if (!form.bannerUrl.trim()) {
      toast.error("Banner URL is required");
      return;
    }

    setSubmitting(true);

    const endpoint =
      user.role === "admin" ? "/api/events/create" : "/api/events/request";

    const toastId = toast.loading(
      user.role === "admin" ? "Creating event…" : "Sending event for approval…",
    );

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          registration: {
            ...form.registration,
            deadline: form.registration.deadline
              ? new Date(form.registration.deadline).toISOString()
              : undefined,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong", { id: toastId });
        return;
      }

      toast.success(
        user.role === "admin"
          ? "Event created successfully"
          : "Event sent for approval",
        { id: toastId },
      );

      router.push(user.role === "admin" ? `/events/${data._id}` : "/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-[#A3A3A3]">
        Checking permissions…
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6 sm:space-y-8 text-white">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Create Event</h1>
        <p className="text-sm text-white/60">
          {user?.role === "admin"
            ? "Fill in the details below to create a new event."
            : "Fill in the details below to request a new event. It will be reviewed by an admin."}
        </p>
      </div>

      <Field label="Event Name">
        <Input
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
      </Field>

      <Field label="Short Description">
        <Textarea
          rows={3}
          value={form.shortDescription}
          onChange={(v) => setForm({ ...form, shortDescription: v })}
          placeholder="Brief overview of the event (max 160 characters)"
          maxLength={160}
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
            modules={{
              toolbar: [
                ["bold", "italic", "underline"],
                [{ header: [2, 3, false] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["clean"],
              ],
            }}
            className="
              text-white
              [&_.ql-editor]:min-h-40
              [&_.ql-editor]:text-sm
              sm:[&_.ql-editor]:text-base
              [&_.ql-editor]:text-white
              [&_.ql-container]:bg-transparent
              [&_.ql-toolbar]:bg-transparent
              [&_.ql-toolbar]:border-white/10
              [&_.ql-toolbar_.ql-stroke]:stroke-white
              [&_.ql-toolbar_.ql-fill]:fill-white
            "
          />
        </div>
      </Field>

      <Field label="Banner Image URL">
        <input
          className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
          placeholder="https://example.com/banner.jpg"
          value={form.bannerUrl}
          onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
        />
      </Field>

      <Field label="Categories">
        <ChipGroup
          values={CATEGORIES}
          selected={form.categories}
          onToggle={(v) => toggleMulti("categories", v)}
        />
      </Field>

      <Field label="Tags">
        <ChipGroup
          values={TAGS}
          selected={form.tags}
          onToggle={(v) => toggleMulti("tags", v)}
        />
      </Field>

      <Field label="Campus">
        <div className="flex flex-wrap gap-2">
          {CAMPUS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, campus: c })}
              className={`px-3 py-1 rounded-full text-sm border transition ${
                form.campus === c
                  ? "bg-[#7C3AED] border-[#7C3AED] text-white"
                  : "border-white/20 text-white/80 hover:border-white/40"
              }`}
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
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>

                <select
                  value={entry.club}
                  onChange={(e) => updateClub(i, e.target.value)}
                  className="w-full rounded-xl bg-[#1a1a2e] px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
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
                      className="w-full h-40 rounded-xl bg-[#1a1a2e] px-4 py-2 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                    >
                      {club.domains.map((d: any) => (
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
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-purple-600/30 text-purple-300 hover:bg-purple-600/40 transition text-sm"
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
            />
          </div>
          <div>
            <label className="text-xs text-white/60 mb-1 block">End Date</label>
            <Input
              type="datetime-local"
              value={form.endDate}
              onChange={(v) => setForm({ ...form, endDate: v })}
            />
          </div>
        </div>
      </Field>

      <Field label="Venue">
        <Input
          value={form.venue}
          onChange={(v) => setForm({ ...form, venue: v })}
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
                  className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
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
                />
              </div>

              <input
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                placeholder="Registration link (optional)"
                value={form.registration.link}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registration: {
                      ...form.registration,
                      link: e.target.value,
                    },
                  })
                }
              />

              <textarea
                rows={2}
                className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm border border-white/10 focus:border-purple-500/50 focus:outline-none"
                placeholder="Registration instructions (optional)"
                value={form.registration.methodText}
                onChange={(e) =>
                  setForm({
                    ...form,
                    registration: {
                      ...form.registration,
                      methodText: e.target.value,
                    },
                  })
                }
              />
            </div>
          )}
        </div>
      </Field>

      {user?.role === "admin" && (
        <Field label="Admin Controls">
          <label className="flex items-center gap-3 text-white text-sm">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
            />
            Pin this event
          </label>
        </Field>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full mt-6 px-6 py-3 rounded-xl bg-[#7C3AED] text-white font-semibold hover:bg-[#6D28D9] transition disabled:opacity-50 text-sm sm:text-base"
      >
        {user?.role === "admin" ? "Create Event" : "Send for Approval"}
      </button>
    </div>
  );
}

/* ---------- Components ---------- */

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
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
    />
  );
}

function Textarea({
  rows,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  rows: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-white/10 px-4 py-3 text-white text-sm sm:text-base border border-white/10 focus:border-purple-500/50 focus:outline-none"
    />
  );
}

function ChipGroup({
  values,
  selected,
  onToggle,
}: {
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onToggle(v)}
          className={`px-3 py-1 rounded-full text-xs sm:text-sm border transition ${
            selected.includes(v)
              ? "bg-[#7C3AED] border-[#7C3AED] text-white"
              : "border-white/20 text-white/80 hover:border-white/40"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
