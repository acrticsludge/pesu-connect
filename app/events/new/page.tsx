/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CATEGORIES = ["TECHNICAL", "CULTURAL", "SPORTS"] as const;
const TAGS = [
  "WORKSHOP",
  "HACKATHON",
  "SEMINAR",
  "COMPETITION",
  "MEETUP",
  "OTHER",
] as const;

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
    campus: "EC",
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

  const removeClub = (i: number) => {
    setForm({
      ...form,
      involvedClubs: form.involvedClubs.filter((_, idx) => idx !== i),
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
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-white">
      <h1 className="text-3xl font-bold">Create Event</h1>

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
        />
      </Field>

      <Field label="Full Description">
        <Textarea
          rows={6}
          value={form.fullDescription}
          onChange={(v) => setForm({ ...form, fullDescription: v })}
        />
      </Field>
      <div>
        <p className="text-white/80 mb-1">Banner Image URL</p>
        <input
          className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
          placeholder="https://example.com/banner.jpg"
          value={form.bannerUrl}
          onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
        />
      </div>

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

      <Field label="Involved Clubs & Domains">
        <div className="space-y-3">
          {form.involvedClubs.map((entry, i) => {
            const club = clubs.find((c) => c._id === entry.club);

            return (
              <div key={i} className="space-y-2">
                <select
                  value={entry.club}
                  onChange={(e) => updateClub(i, e.target.value)}
                  className="w-full rounded-xl bg-[#0F0F14] border border-white/20 px-4 py-3 text-white outline-none"
                >
                  <option value="">Select club</option>
                  {clubs.map((c) => (
                    <option
                      key={c._id}
                      value={c._id}
                      className="bg-[#0F0F14] text-white"
                    >
                      {c.name}
                    </option>
                  ))}
                </select>

                <select
                  multiple
                  value={entry.domains}
                  disabled={!club}
                  onChange={(e) =>
                    updateDomains(
                      i,
                      Array.from(e.target.selectedOptions).map(
                        (o) => o.value as string,
                      ),
                    )
                  }
                  className="w-full h-40 rounded-xl bg-[#0F0F14] border border-white/20 px-4 py-2 text-white outline-none"
                >
                  {club?.domains.map((d: any) => (
                    <option
                      key={d.name}
                      value={d.name}
                      className="bg-[#0F0F14] text-white"
                    >
                      {d.name}
                    </option>
                  ))}
                </select>

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
                  className="text-sm text-red-400"
                >
                  Remove
                </button>
              </div>
            );
          })}

          <button
            type="button"
            onClick={addClub}
            className="text-sm text-[#7C3AED]"
          >
            + Add another club
          </button>
        </div>
      </Field>

      <Field label="Event Dates">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            type="datetime-local"
            value={form.startDate}
            onChange={(v) => setForm({ ...form, startDate: v })}
          />
          <Input
            type="datetime-local"
            value={form.endDate}
            onChange={(v) => setForm({ ...form, endDate: v })}
          />
        </div>
      </Field>

      <Field label="Venue">
        <Input
          value={form.venue}
          onChange={(v) => setForm({ ...form, venue: v })}
        />
      </Field>
      {user.role === "admin" && (
        <label className="flex items-center gap-3 text-white/90">
          <input
            type="checkbox"
            checked={form.isPinned}
            onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
          />
          Pin this event
        </label>
      )}
      <div className="space-y-2">
        <p className="text-white/80">Registration</p>

        <label className="flex items-center gap-3 text-white/90">
          <input
            type="checkbox"
            checked={form.registration.isRegister}
            onChange={(e) =>
              setForm({
                ...form,
                registration: {
                  ...form.registration,
                  isRegister: e.target.checked,
                },
              })
            }
          />
          Registration required
        </label>

        {form.registration.isRegister && (
          <>
            <input
              type="datetime-local"
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white"
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

            <input
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white"
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

            <input
              className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white"
              placeholder="Registration method text (optional)"
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
          </>
        )}
      </div>

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full mt-6 px-6 py-3 rounded-xl bg-[#7C3AED] font-semibold hover:bg-[#6D28D9]"
      >
        {user.role === "admin" ? "Create Event" : "Send for Approval"}
      </button>

      <style jsx>{`
        .select-dark {
          background: #0f0f14;
          color: white;
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 0.75rem 1rem;
          outline: none;
        }
        select option {
          background: #0f0f14;
          color: white;
        }
      `}</style>
    </div>
  );
}

/* ---------- Types ---------- */

type FieldProps = {
  label: string;
  children: React.ReactNode;
};

type InputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
};

type TextareaProps = {
  rows: number;
  value: string;
  onChange: (value: string) => void;
};

type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
};

type ChipGroupProps = {
  values: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
};

/* ---------- Components ---------- */

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <p className="text-white/80 mb-1">{label}</p>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = "text", placeholder }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
    />
  );
}

function Textarea({ rows, value, onChange }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none"
    />
  );
}

function Select({ value, options, onChange }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="select-dark w-full"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ChipGroup({ values, selected, onToggle }: ChipGroupProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onToggle(v)}
          className={`px-3 py-1 rounded-full text-sm border ${
            selected.includes(v)
              ? "bg-[#7C3AED] border-[#7C3AED]"
              : "border-white/20 text-white/80"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
