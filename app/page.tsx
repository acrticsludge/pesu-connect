"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import EventCard from "./Cards/EventCards/EventCard";
import ClubCard from "./Cards/ClubCards/ClubCard";
import { BaseEventData, EventTag } from "@/lib/types/event";
import { useEvents } from "@/lib/hooks/useEvents";
import { useClubs } from "@/lib/hooks/useClubs";
import { useDragScroll } from "@/lib/hooks/useDragScroll";

export default function Home() {
  const upcomingRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const clubsScrollRef = useRef<HTMLDivElement>(null);

  const [activeFilter, setActiveFilter] = useState<EventTag | "all">("all");

  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents();
  const {
    data: clubs = [],
    isLoading: clubsLoading,
    error: clubsError,
  } = useClubs();

  useDragScroll(eventsScrollRef);
  useDragScroll(clubsScrollRef);

  const filteredEvents = useMemo(() => {
    return activeFilter === "all"
      ? events
      : events.filter((e) => e.tags?.includes(activeFilter));
  }, [events, activeFilter]);

  const sortedEvents = useMemo(() => {
    return [...filteredEvents]
      .filter((event) => new Date(event.endDate).getTime() >= Date.now())
      .sort((a, b) => {
        if (a.isPinned === b.isPinned) {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }
        return a.isPinned ? -1 : 1;
      });
  }, [filteredEvents]);

  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => {
      if (a.isRecruiting === b.isRecruiting) return 0;
      return a.isRecruiting ? -1 : 1;
    });
  }, [clubs]);

  const scrollBy = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, offset: number) => {
      if (!ref.current) return;
      ref.current.scrollBy({ left: offset, behavior: "smooth" });
    },
    [],
  );

  const filterOptions = useMemo(
    () =>
      [
        "all",
        "WORKSHOP",
        "HACKATHON",
        "SEMINAR",
        "COMPETITION",
        "MEETUP",
        "OTHER",
      ] as const,
    [],
  );

  if (eventsError || clubsError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4 text-lg">Failed to load content</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg active:scale-95"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 px-4 text-center pb-20 sm:pb-24">
        <span className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#CCFF00] text-xs sm:text-sm font-mono font-medium mb-4">
          PES University Events Portal
        </span>

        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white">
          Discover Campus
        </h1>
        <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#7C3AED] mb-6">
          Events & Activities
        </h2>

        <p className="text-sm sm:text-lg text-[#A3A3A3] max-w-3xl mx-auto mb-8 sm:mb-10 px-4">
          Stay updated with all college events, club activities, and
          competitions in one place.
        </p>

        <div className="flex gap-3">
          <Link href="/events">
            <button className="px-6 sm:px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-95">
              Events
            </button>
          </Link>
          <Link href="/clubs">
            <button className="px-6 sm:px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-95">
              Clubs
            </button>
          </Link>
        </div>
      </div>

      <div ref={upcomingRef} className="py-10 sm:py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Upcoming Events
            </h2>
            <Link
              href="/events"
              className="text-sm text-purple-400 active:text-purple-300"
            >
              View all →
            </Link>
          </div>

          <div className="flex gap-2 pb-3 overflow-x-auto sm:overflow-visible flex-nowrap sm:flex-wrap sm:justify-end no-scrollbar">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap active:scale-95 ${
                  activeFilter === filter
                    ? "bg-[#7C3AED] text-white"
                    : "bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]"
                }`}
              >
                {filter === "all"
                  ? "All Events"
                  : filter.charAt(0).toUpperCase() +
                    filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-black to-transparent z-10 pointer-events-none" />

          <button
            onClick={() => scrollBy(eventsScrollRef, -300)}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div
            ref={eventsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-8 no-scrollbar"
          >
            {eventsLoading ? (
              <div className="text-white/50 text-sm py-8 px-4">
                Loading events…
              </div>
            ) : sortedEvents.length === 0 ? (
              <div className="text-white/50 flex items-center justify-center text-xl py-8 w-full">
                No upcoming events...
              </div>
            ) : (
              sortedEvents.map((event) => (
                <div
                  key={event._id}
                  className="snap-start shrink-0 w-[85%] sm:w-80 md:w-90 lg:w-95"
                >
                  <Link href={`/events/${event._id}`} className="block h-full">
                    <EventCard event={event} />
                  </Link>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => scrollBy(eventsScrollRef, 300)}
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>

      <div ref={clubRef} className="py-10 sm:py-16 scroll-mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 flex items-center justify-between">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Clubs</h2>
          <Link
            href="/clubs"
            className="text-sm text-purple-400 active:text-purple-300"
          >
            View all →
          </Link>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-black to-transparent z-10 pointer-events-none" />

          <button
            onClick={() => scrollBy(clubsScrollRef, -300)}
            className="hidden sm:flex absolute -left-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"
            aria-label="Scroll left"
          >
            ‹
          </button>

          <div
            ref={clubsScrollRef}
            className="flex items-stretch gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-12 no-scrollbar"
          >
            {clubsLoading ? (
              <div className="text-white/50 text-sm py-8 px-4">
                Loading clubs…
              </div>
            ) : sortedClubs.length === 0 ? (
              <div className="text-white/50 flex items-center justify-center text-xl py-8 w-full">
                No clubs to display...
              </div>
            ) : (
              sortedClubs.map((club) => (
                <div
                  key={club._id}
                  className="snap-start shrink-0 w-[85%] sm:w-80 md:w-90 lg:w-95"
                >
                  <Link href={`/clubs/${club._id}`} className="block h-full">
                    <ClubCard club={club} />
                  </Link>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => scrollBy(clubsScrollRef, 300)}
            className="hidden sm:flex absolute -right-5 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white active:scale-90"
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
