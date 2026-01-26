"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

import type { Club, ClubDomain } from "@/lib/types/club";
import type { Event } from "@/lib/types/event";

import { DateTimePicker } from "@/components/ui/date-time-picker";

/* =======================
   TYPES
   ======================= */

type EventTag = "technical" | "cultural" | "sports";

type UserContext = {
  srn: string;
  isAdmin: boolean;
};

type Props = {
  event: Event;
  clubs: Club[];
  user: UserContext;
};

const AVAILABLE_TAGS: EventTag[] = ["technical", "cultural", "sports"];

/* =======================
   COMPONENT
   ======================= */

export default function EditEventClient({ event, clubs, user }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  /* =======================
     FORM STATE
     ======================= */

  // Find the club by slug (since event.club is an object with name/slug)
  const initialClubId =
    clubs.find((c) => c.slug === event.club.slug)?._id || clubs[0]?._id || "";

  const [form, setForm] = useState({
    title: event.title,
    shortDescription: event.shortDescription,
    description: event.description,

    bannerImage: {
      url: event.bannerImage?.url ?? "",
      alt: event.bannerImage?.alt ?? "",
    },

    registrationDeadline: event.registrationDeadline
      ? new Date(event.registrationDeadline)
      : null,
    eventDate: event.eventDate ? new Date(event.eventDate) : null,

    venue: event.venue,

    organizingClubId: initialClubId,
    domains: Array.isArray(event.domains) ? event.domains : [],

    tags: event.tags,
    isPinned: event.isPinned,
    isActive: event.isActive,
  });

  function updateField<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTag(tag: EventTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  }

  /* =======================
     DERIVED DATA
     ======================= */

  const selectedClub = clubs.find((c) => c._id === form.organizingClubId);

  const isAdmin = user.isAdmin;

  const isClubLead =
    selectedClub?.clubLeads.some((l) => l.srn === user.srn) ?? false;

  const isDomainLead = (domain: ClubDomain) =>
    domain.domainLeads.some((l) => l.srn === user.srn);

  const canEditBanner = isAdmin || isClubLead;
  const canChangeClub = isAdmin;

  const allowedDomains =
    selectedClub?.domains.filter((domain) => {
      if (isAdmin) return true;
      if (isClubLead) return true;
      return isDomainLead(domain);
    }) ?? [];

  function toggleDomain(domainName: string) {
    updateField(
      "domains",
      form.domains.includes(domainName)
        ? form.domains.filter((d) => d !== domainName)
        : [...form.domains, domainName],
    );
  }

  /* =======================
     ACTIONS
     ======================= */

  async function save() {
    setLoading(true);

    const payload = {
      title: form.title,
      shortDescription: form.shortDescription,
      description: form.description,
      venue: form.venue,
      isPinned: form.isPinned,
      isActive: form.isActive,

      bannerImage: canEditBanner ? form.bannerImage : undefined,

      registrationDeadline: form.registrationDeadline
        ? form.registrationDeadline.toISOString()
        : null,
      eventDate: form.eventDate ? form.eventDate.toISOString() : null,

      clubId: canChangeClub ? form.organizingClubId : undefined,
      domains: form.domains,
      tags: form.tags,
    };

    const res = await fetch(`/api/admin/events/${event._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    const data = await res.json();
    // Log debug info from the API response
    if (data.debug) {
      console.log("[DEBUG] PATCH /api/admin/events/[id] response:", data.debug);
    }

    if (!res.ok) {
      alert("Failed to update event");
      return;
    }

    router.push("/admin/events");
  }

  async function deleteEvent() {
    if (!confirm("Delete this event permanently?")) return;
    await fetch(`/api/admin/events/${event._id}`, { method: "DELETE" });
    router.push("/admin/events");
  }

  /* =======================
     RENDER
     ======================= */

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Edit Event</h1>

        <div className="flex gap-2">
          <button
            onClick={() => updateField("isPinned", !form.isPinned)}
            className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg font-medium hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-shadow cursor-pointer text-sm"
          >
            {form.isPinned ? "Unpin" : "Pin"}
          </button>

          {isAdmin && (
            <button
              onClick={deleteEvent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* BASIC DETAILS */}
      <Section title="Basic Details">
        <Field label="Title">
          <input
            className="input"
            value={form.title}
            onChange={(e) => updateField("title", e.target.value)}
          />
        </Field>

        <Field label="Short Description">
          <input
            className="input"
            value={form.shortDescription}
            onChange={(e) => updateField("shortDescription", e.target.value)}
          />
        </Field>

        <Field label="Description">
          <textarea
            className="input"
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </Field>
      </Section>

      {/* BANNER */}
      {canEditBanner && (
        <Section title="Event Banner">
          <div className="space-y-4">
            <Field label="Banner Image URL">
              <input
                className="input"
                value={form.bannerImage.url}
                onChange={(e) =>
                  updateField("bannerImage", {
                    ...form.bannerImage,
                    url: e.target.value,
                  })
                }
                placeholder="https://example.com/banner.png"
              />
            </Field>

            <Field label="Alt Text">
              <input
                className="input"
                value={form.bannerImage.alt}
                onChange={(e) =>
                  updateField("bannerImage", {
                    ...form.bannerImage,
                    alt: e.target.value,
                  })
                }
                placeholder="Describe the banner image"
              />
            </Field>
          </div>

          {form.bannerImage.url && (
            <div className="relative h-48 rounded-lg overflow-hidden border border-white/10 mt-4">
              <Image
                src={form.bannerImage.url}
                alt={form.bannerImage.alt || "Event banner"}
                fill
                className="object-cover"
              />
            </div>
          )}
        </Section>
      )}

      {/* SCHEDULE */}
      <Section title="Schedule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Registration Deadline">
            <DateTimePicker
              value={form.registrationDeadline}
              onChange={(d) => updateField("registrationDeadline", d)}
              placeholder="Select deadline"
            />
          </Field>

          <Field label="Event Date">
            <DateTimePicker
              value={form.eventDate}
              onChange={(d) => updateField("eventDate", d)}
              placeholder="Select event date"
            />
          </Field>
        </div>
      </Section>

      {/* LOCATION */}
      <Section title="Location">
        <Field label="Venue">
          <input
            className="input"
            value={form.venue}
            onChange={(e) => updateField("venue", e.target.value)}
          />
        </Field>
      </Section>

      {/* TAGS */}
      <Section title="Tags">
        <Field label="Event Tags">
          <div className="flex gap-4">
            {AVAILABLE_TAGS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-2 text-white text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.tags.includes(tag)}
                  onChange={() => toggleTag(tag)}
                  className="accent-[#7C3AED]"
                />
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </label>
            ))}
          </div>
        </Field>
      </Section>

      {/* ORGANIZATION */}
      <Section title="Organization">
        {canChangeClub && (
          <Field label="Organizing Club">
            <select
              className="input"
              value={form.organizingClubId}
              onChange={(e) => {
                const newClubId = e.target.value;
                updateField("organizingClubId", newClubId);
                // Optionally reset domains to those available in the new club
                updateField("domains", []);
              }}
            >
              {clubs.map((club) => (
                <option key={club._id} value={club._id}>
                  {club.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Involved Domains">
          {!selectedClub && (
            <p className="text-sm text-white/50">
              Select a club to see its domains
            </p>
          )}

          {selectedClub && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allowedDomains.map((domain) => {
                const disabled =
                  !isAdmin &&
                  !isClubLead &&
                  !domain.domainLeads.some((l) => l.srn === user.srn);

                return (
                  <label
                    key={domain.name}
                    className={`flex items-center gap-2 rounded-lg border border-white/10 p-3 text-sm
                      ${
                        disabled
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:border-[#7C3AED]/40 cursor-pointer"
                      }`}
                  >
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={form.domains.includes(domain.name)}
                      onChange={() => toggleDomain(domain.name)}
                      className="accent-[#7C3AED]"
                    />
                    {domain.name}
                  </label>
                );
              })}
            </div>
          )}
        </Field>
      </Section>

      {/* STATUS */}
      <Section title="Status">
        <label className="flex items-center gap-2 text-white text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => updateField("isActive", e.target.checked)}
            className="accent-[#7C3AED]"
          />
          Active
        </label>
      </Section>

      <button
        onClick={save}
        disabled={loading}
        className="w-full px-4 py-3 bg-[#7C3AED] text-white rounded-lg disabled:opacity-50"
      >
        {loading ? "Saving…" : "Update Event"}
      </button>
    </div>
  );
}

/* =======================
   UI HELPERS
   ======================= */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0A0A0A]/40 p-4 space-y-4">
      <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide">
        {title}
      </h2>
      {children}
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
    <div className="space-y-1">
      <label className="text-sm font-medium text-white">{label}</label>
      {children}
    </div>
  );
}
