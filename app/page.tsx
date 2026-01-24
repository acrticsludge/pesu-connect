"use client";
import Image from "next/image";
import { Event, EventTag } from "@/lib/types/event";
import { useRef, useState, useEffect } from "react";
import EventCard from "./Cards/EventCards/EventCard";
import { Club } from "@/lib/types/club";
import ClubCard from "./Cards/ClubCards/ClubCard";

export default function Home() {
  const upcomingRef = useRef<HTMLDivElement>(null);
  const clubRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<Event[]>([]);
  const [activeFilter, setActiveFilter] = useState<EventTag | "all">("all");
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  const filteredEvents =
    activeFilter === "all"
      ? events
      : events.filter((event) => event.tags.includes(activeFilter));

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events");
        const data: Event[] = await res.json();
        setEvents(data);
      } finally {
        setLoading(false);
      }
    };

    const fetchClubs = async () => {
      try {
        const res = await fetch("/api/clubs");
        const data: Club[] = await res.json();
        setClubs(data);
      } finally {
        setClubsLoading(false);
      }
    };

    fetchClubs();
    fetchEvents();
  }, []);

  const scrollToUpcoming = () => {
    upcomingRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollToClubs = () => {
    clubRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div>
      <div className="flex flex-col items-center justify-center pt-12 sm:pt-16 px-4 text-center pb-20 sm:pb-24">
        <span className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/30 rounded-full text-[#CCFF00] text-xs sm:text-sm font-mono font-medium mb-4">
          PES University Events Portal
        </span>

        <div className="flex flex-col items-center">
          <div className="text-3xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
            Discover Campus
          </div>
          <div className="text-3xl sm:text-5xl lg:text-7xl font-bold text-[#7C3AED] leading-tight mb-6">
            Events &amp; Activities
          </div>
        </div>

        <p className="text-sm sm:text-lg text-[#A3A3A3] max-w-3xl mx-auto mb-8 sm:mb-10">
          Stay updated with all college events, club activities, and
          competitions in one place. Never miss out on what&apos;s happening at
          PES.
        </p>
        <div className="flex gap-2">
          <button
            onClick={scrollToUpcoming}
            className="px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg transition-shadow active:scale-[0.97] cursor-pointer"
          >
            Events
          </button>
          <button
            onClick={scrollToClubs}
            className="px-7 py-3 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg transition-shadow active:scale-[0.97] cursor-pointer"
          >
            Clubs
          </button>
        </div>
      </div>

      <div ref={upcomingRef} className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left">
              Upcoming Events
            </h2>
            <p className="text-sm sm:text-base text-[#A3A3A3] max-w-2xl">
              Stay on top of technical, cultural, and sports events happening
              across campus.
            </p>

            <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-end">
              {(["all", "technical", "cultural", "sports"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
                      ${
                        activeFilter === filter
                          ? "bg-[#7C3AED] text-white"
                          : "bg-[#0A0A0A] border border-white/10 text-[#A3A3A3]"
                      }`}
                  >
                    {filter === "all"
                      ? "All Events"
                      : filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ),
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-[#A3A3A3]">
              Loading events...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm sm:text-xl text-[#A3A3A3]">
                No events found in this category.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div ref={clubRef} className="py-10 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left">
              Clubs
            </h2>
            <p className="text-sm sm:text-base text-[#A3A3A3] max-w-2xl">
              Explore student clubs, their domains, and what they work on across
              campus.
            </p>
          </div>

          {clubsLoading ? (
            <div className="text-center py-16 text-[#A3A3A3]">
              Loading clubs...
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-16 text-[#A3A3A3]">
              No clubs available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {clubs.map((club) => (
                <ClubCard key={club._id} club={club} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
