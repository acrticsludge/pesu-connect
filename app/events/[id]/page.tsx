"use client";

import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEvent } from "@/lib/hooks/useEvents";
import { useUser } from "@/lib/hooks/useUser";
import { useEventPermissions } from "@/lib/hooks/useEventPermissions";

const FALLBACK_BANNER = "/placeholder-banner.png";

const safeImageSrc = (url?: string) => {
  if (!url) return FALLBACK_BANNER;
  try {
    new URL(url);
    return url;
  } catch {
    return FALLBACK_BANNER;
  }
};

const formatDateTime = (d: string | Date) =>
  new Date(d).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

export default function EventPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: user } = useUser();
  const { canEdit, isLoading: permissionsLoading } = useEventPermissions(
    event,
    user,
  );

  if (!id) {
    return notFound();
  }

  if (eventLoading || permissionsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return notFound();

  const bannerSrc = safeImageSrc(event?.bannerUrl);
  const isPast = new Date(event.endDate).getTime() < Date.now();
  const regDeadline = event.registration?.deadline
    ? new Date(event.registration.deadline)
    : null;
  const isRegClosed = regDeadline ? regDeadline.getTime() < Date.now() : false;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-105 w-105 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-56 sm:h-72 md:h-80 w-full">
        <Image
          src={bannerSrc}
          alt={`Banner for ${event.name}`}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 w-full">
            <nav className="mb-4 text-sm text-[#A3A3A3]">
              <ol className="flex items-center gap-2">
                <li>
                  <Link href="/events" className="hover:text-white transition">
                    Events
                  </Link>
                </li>
                <span>›</span>
                <li className="text-white font-medium truncate max-w-50 sm:max-w-md">
                  {event.name}
                </li>
              </ol>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
                  {event.name}
                </h1>

                <div className="flex flex-wrap gap-2">
                  {event.categories?.map((c: string) => (
                    <span
                      key={c}
                      className="px-3 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200"
                    >
                      {c}
                    </span>
                  ))}
                  {event.tags?.map((t: string) => (
                    <span
                      key={t}
                      className="px-3 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-white/70"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {canEdit && (
                <Link href={`/events/${event._id}/edit`} className="shrink-0">
                  <button className="relative px-6 py-2.5 rounded-full font-bold text-sm sm:text-base text-white bg-linear-to-br from-[#7C3AED] via-[#9333EA] to-[#A855F7] shadow-[0_0_22px_rgba(168,85,247,0.8)] border border-purple-300/40 transition-all duration-200 hover:shadow-[0_0_36px_rgba(168,85,247,1)] hover:scale-[1.04] active:scale-[0.97] overflow-hidden cursor-pointer whitespace-nowrap">
                    <span className="relative z-10">Edit Event</span>
                    <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent)] opacity-0 hover:opacity-100 transition-opacity" />
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] min-w-0">
          <div className="space-y-8 min-w-0">
            {event.fullDescription && (
              <section className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  About the Event
                </h2>
                <div
                  className="prose prose-invert max-w-none text-sm sm:text-base break-words overflow-x-hidden [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-4"
                  dangerouslySetInnerHTML={{
                    __html: event.fullDescription,
                  }}
                />
              </section>
            )}

            {event.involvedClubs && event.involvedClubs.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                  Involved Clubs & Domains
                </h2>

                <div className="space-y-4">
                  {event.involvedClubs.map((entry: any, index: number) => {
                    const club = entry.club;
                    if (!club) return null;

                    return (
                      <div
                        key={club._id || index}
                        className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4"
                      >
                        <h3 className="text-white font-semibold mb-1">
                          <Link
                            href={`/clubs/${club._id}`}
                            className="hover:text-purple-400 hover:underline transition"
                          >
                            {club.name || "Unknown Club"}
                          </Link>
                        </h3>

                        {entry.domains && entry.domains.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {entry.domains.map((domain: string) => (
                              <Link
                                key={domain}
                                href={`/clubs/${club._id}/${slugify(domain)}`}
                                className="px-3 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200 hover:bg-purple-500/25 transition active:scale-95"
                              >
                                {domain}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-3">
                Event Details
              </h2>

              <div className="space-y-3 text-sm text-[#A3A3A3]">
                <div className="flex flex-col sm:flex-row sm:gap-1">
                  <span className="text-white/60 sm:whitespace-nowrap">
                    Date:
                  </span>
                  <span className="text-white font-medium">
                    {formatDateTime(event.startDate)} –{" "}
                    {formatDateTime(event.endDate)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:gap-1">
                  <span className="text-white/60 sm:whitespace-nowrap">
                    Venue:
                  </span>
                  <span className="text-white font-medium">{event.venue}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:gap-1">
                  <span className="text-white/60 sm:whitespace-nowrap">
                    Campus:
                  </span>
                  <span className="text-white font-medium">{event.campus}</span>
                </div>

                {regDeadline && !isRegClosed && (
                  <div className="flex flex-col sm:flex-row sm:gap-1">
                    <span className="text-white/60 sm:whitespace-nowrap">
                      Last day to register:
                    </span>
                    <span className="text-white font-medium">
                      {formatDateTime(regDeadline)}
                    </span>
                  </div>
                )}

                {regDeadline && isRegClosed && (
                  <div className="text-red-400 font-medium">
                    Registration closed
                  </div>
                )}

                {isPast && (
                  <div className="text-red-400 font-medium">
                    This event has ended
                  </div>
                )}
              </div>
            </section>

            {event.registration?.isRegister &&
              event.registration?.link &&
              !isPast &&
              !isRegClosed && (
                <button
                  onClick={() =>
                    window.open(
                      event.registration.link,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="w-full px-5 py-3 rounded-full text-sm font-semibold bg-green-500 text-black hover:bg-green-400 transition active:scale-[0.98]"
                >
                  Register Now
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
