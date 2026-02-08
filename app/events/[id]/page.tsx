"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type EventResponse = {
  event: any;
};

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

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const bannerSrc = safeImageSrc(event?.bannerUrl);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/events/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data: EventResponse) => setEvent(data.event))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="text-center text-[#A3A3A3] py-20">Loading event...</div>
    );
  }

  if (!event) return notFound();

  const isPast = new Date(event.endDate).getTime() < Date.now();
  const regDeadline = event.registration?.deadline
    ? new Date(event.registration.deadline)
    : null;
  const isRegClosed = regDeadline ? regDeadline.getTime() < Date.now() : false;

  const formatDate = (d: string | Date) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-105 w-105 rounded-full bg-purple-600/20 blur-[140px]" />
      </div>

      <div className="relative h-56 sm:h-72 md:h-80 w-full">
        <Image
          src={bannerSrc}
          alt={event.name}
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
                  <Link href="/events" className="hover:text-white">
                    Events
                  </Link>
                </li>
                <span>›</span>
                <li className="text-white font-medium">{event.name}</li>
              </ol>
            </nav>

            <div className="flex flex-col gap-3">
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            {event.fullDescription && (
              <section>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                  About the Event
                </h2>
                <div
                  className="prose prose-invert max-w-none text-sm sm:text-base"
                  dangerouslySetInnerHTML={{
                    __html: event.fullDescription,
                  }}
                />
              </section>
            )}

            <section>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
                Involved Clubs & Domains
              </h2>

              <div className="space-y-4">
                {event.involvedClubs.map((entry: any) => {
                  const club = entry.club;

                  return (
                    <div
                      key={club._id}
                      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur p-4"
                    >
                      <h3 className="text-white font-semibold mb-1">
                        <Link
                          href={`/clubs/${club._id}`}
                          className="hover:text-purple-400 hover:underline"
                        >
                          {club.name}
                        </Link>
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {entry.domains.map((domain: string) => (
                          <Link
                            key={domain}
                            href={`/clubs/${club._id}/${slugify(domain)}`}
                            className="px-3 py-1 rounded-full text-xs bg-purple-500/15 border border-purple-500/30 text-purple-200 hover:bg-purple-500/25"
                          >
                            {domain}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
              <h2 className="text-lg font-bold text-white mb-3">
                Event Details
              </h2>

              <div className="space-y-3 text-sm text-[#A3A3A3]">
                <div>
                  Date:{" "}
                  <span className="text-white font-medium">
                    {formatDate(event.startDate)} – {formatDate(event.endDate)}
                  </span>
                </div>

                <div>
                  Venue:{" "}
                  <span className="text-white font-medium">{event.venue}</span>
                </div>

                <div>
                  Campus:{" "}
                  <span className="text-white font-medium">{event.campus}</span>
                </div>

                {regDeadline && !isRegClosed && (
                  <div>
                    Last day to register:{" "}
                    <span className="text-white font-medium">
                      {formatDate(regDeadline)}
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
              !isRegClosed && (
                <button
                  onClick={() =>
                    window.open(
                      event.registration.link,
                      "_blank",
                      "noopener,noreferrer",
                    )
                  }
                  className="w-full px-5 py-3 rounded-full text-sm font-semibold bg-green-500 text-black hover:bg-green-400 transition"
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
