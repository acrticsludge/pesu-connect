"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import EventCard from "./Cards/EventCards/EventCard";
import ClubCard from "./Cards/ClubCards/ClubCard";
import { BaseEventData, EventTag } from "@/lib/types/event";
import { Club } from "@/lib/types/club";

export default function Home() {
  const upcomingRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const clubsScrollRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<BaseEventData[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [activeFilter, setActiveFilter] = useState<EventTag | "all">("all");
  const [loading, setLoading] = useState(true);
  const [clubsLoading, setClubsLoading] = useState(true);

  const filteredEvents =
    activeFilter === "all"
      ? events
      : events.filter((e) => e.tags.includes(activeFilter));
  const sortedEvents = [...filteredEvents]
    .filter((event) => new Date(event.endDate).getTime() >= Date.now())
    .sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        return (
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      }
      return a.isPinned ? -1 : 1;
    });

  const sortedClubs = [...clubs].sort((a, b) => {
    if (a.isRecruiting === b.isRecruiting) return 0;
    return a.isRecruiting ? -1 : 1;
  });

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data.events))
      .finally(() => setLoading(false));

    fetch("/api/clubs")
      .then((res) => res.json())
      .then(setClubs)
      .finally(() => setClubsLoading(false));
  }, []);

  const scrollBy = (
    ref: React.RefObject<HTMLDivElement | null>,
    offset: number,
  ) => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const enableDragScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    el.onmousedown = (e) => {
      isDown = true;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    el.onmouseleave = () => (isDown = false);
    el.onmouseup = () => (isDown = false);

    el.onmousemove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      el.scrollLeft = scrollLeft - (x - startX) * 1.2;
    };
  };

  useEffect(() => {
    enableDragScroll(eventsScrollRef);
    enableDragScroll(clubsScrollRef);
  }, []);

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 px-4 text-center pb-20 sm:pb-24">
        <span className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#CCFF00] text-xs sm:text-sm font-mono font-medium mb-4">
          PES University Events Portal
        </span>

        <div className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white">
          Discover Campus
        </div>
        <div className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#7C3AED] mb-6">
          Events & Activities
        </div>

        <p className="text-sm sm:text-lg text-[#A3A3A3] max-w-3xl mx-auto mb-8 sm:mb-10">
          Stay updated with all college events, club activities, and
          competitions in one place.
        </p>

        <div className="flex gap-2">
          <button
            onClick={() =>
              upcomingRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-[0.97] cursor-pointer"
          >
            Events
          </button>
          <button
            onClick={() =>
              clubRef.current?.scrollIntoView({ behavior: "smooth" })
            }
            className="px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-[0.97] cursor-pointer"
          >
            Clubs
          </button>
        </div>
      </div>

      <div ref={upcomingRef} className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex items-center justify-between">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Upcoming Events
            </h2>
            <Link href="/events" className="text-sm text-purple-400">
              View all
            </Link>
          </div>

          <div className="flex gap-2 pb-3 overflow-x-auto sm:overflow-visible flex-nowrap sm:flex-wrap sm:justify-end">
            {(
              [
                "all",
                "WORKSHOP",
                "HACKATHON",
                "SEMINAR",
                "COMPETITION",
                "MEETUP",
                "OTHER",
              ] as const
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm shrink-0 ${
                  activeFilter === filter
                    ? "bg-[#7C3AED] text-white"
                    : "bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]"
                }`}
              >
                {filter === "all"
                  ? "All Events"
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-black to-transparent z-10 pointer-events-none" />

          <button
            onClick={() => scrollBy(eventsScrollRef, -400)}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ‹
          </button>
          {sortedEvents.length === 0 && !loading && (
            <div className="text-white/50 flex items-center justify-center text-xl py-8">
              No upcoming events...
            </div>
          )}
          <div
            ref={eventsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto overflow-y-visible scroll-smooth snap-x snap-mandatory py-8
  [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {loading && (
              <div className="text-white/50 text-sm py-8">Loading events…</div>
            )}

            {!loading &&
              sortedEvents.map((event) => (
                <div
                  key={event.name}
                  className="snap-start shrink-0 w-[88%] sm:w-90 lg:w-95"
                >
                  <Link href={`/events/${event._id}`} className="block h-full">
                    <EventCard event={event} />
                  </Link>
                </div>
              ))}
          </div>

          <button
            onClick={() => scrollBy(eventsScrollRef, 400)}
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ›
          </button>
        </div>
      </div>

      <div ref={clubRef} className="py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Clubs</h2>
          <Link href="/clubs" className="text-sm text-purple-400">
            View all
          </Link>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-black to-transparent z-10 pointer-events-none" />

          <button
            onClick={() => scrollBy(clubsScrollRef, -400)}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ‹
          </button>

          <div className="overflow-hidden">
            {sortedClubs.length === 0 && !clubsLoading && (
              <div className="text-white/50 flex items-center justify-center text-xl py-8">
                No clubs to display...
              </div>
            )}
            <div
              ref={clubsScrollRef}
              className="
      flex items-stretch gap-4
      overflow-x-auto scroll-smooth snap-x snap-mandatory
      px-2 sm:px-4
      py-12
      [-ms-overflow-style:none]
      [scrollbar-width:none]
      [&::-webkit-scrollbar]:hidden
    "
            >
              {clubsLoading && (
                <div className="text-white/50 text-sm py-8">Loading clubs…</div>
              )}
              {!clubsLoading &&
                sortedClubs.map((club) => (
                  <div
                    key={club._id}
                    className="snap-start shrink-0 w-[88%] sm:w-90 lg:w-95"
                  >
                    <Link href={`/clubs/${club._id}`} className="block h-full">
                      <ClubCard club={club} />
                    </Link>
                  </div>
                ))}
            </div>
          </div>

          <button
            onClick={() => scrollBy(clubsScrollRef, 400)}
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
