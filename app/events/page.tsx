"use client";

import { useMemo, useState } from "react";
import EventCard from "../Cards/EventCards/EventCard";
import { BaseEventData } from "@/lib/types/event";
import Link from "next/link";
import { useEvents } from "@/lib/hooks/useEvents";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useSearchSuggestions } from "@/lib/hooks/useSearchSuggestions";

const isPastEvent = (event: BaseEventData) =>
  new Date(event.endDate).getTime() < Date.now();

const isClosingSoon = (event: BaseEventData) => {
  const d = event.registration?.deadline;
  if (!d) return false;
  const diff = new Date(d).getTime() - Date.now();
  return diff > 0 && diff <= 2 * 24 * 60 * 60 * 1000;
};

function fuzzyMatch(query: string, text: string) {
  const q = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  const t = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  if (!q) return true;
  if (t.includes(q)) return true;

  const qWords = q.split(" ").filter(Boolean);
  const tWords = t.split(" ").filter(Boolean);

  return qWords.every((qw) => tWords.some((tw) => tw.includes(qw)));
}

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const words = query.toLowerCase().split(" ").filter(Boolean);
  const regex = new RegExp(`(${words.join("|")})`, "gi");
  return text.split(regex).map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-purple-500/30 text-purple-200 rounded px-1">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

export default function EventsPage() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [campusFilter, setCampusFilter] = useState<"ALL" | "EC" | "RR">("ALL");

  const debouncedQuery = useDebounce(query, 250);
  const { data: events = [], isLoading } = useEvents();
  const suggestions = useSearchSuggestions(events, debouncedQuery);

  const filteredEvents = useMemo(() => {
    const ranked = events
      .filter((e) =>
        campusFilter === "ALL" ? true : e.campus === campusFilter,
      )
      .map((event) => {
        let score = 0;
        if (fuzzyMatch(debouncedQuery, event.name)) score += 6;
        if (
          event.shortDescription &&
          fuzzyMatch(debouncedQuery, event.shortDescription)
        )
          score += 3;
        event.tags?.forEach((t) => {
          if (fuzzyMatch(debouncedQuery, t)) score += 4;
        });
        event.categories?.forEach((c) => {
          if (fuzzyMatch(debouncedQuery, c)) score += 4;
        });
        return { event, score };
      })
      .filter((item) => !debouncedQuery.trim() || item.score > 0);

    ranked.sort((a, b) => {
      if (a.event.isPinned && !b.event.isPinned) return -1;
      if (!a.event.isPinned && b.event.isPinned) return 1;
      if (isClosingSoon(a.event) && !isClosingSoon(b.event)) return -1;
      if (!isClosingSoon(a.event) && isClosingSoon(b.event)) return 1;
      const aPast = isPastEvent(a.event);
      const bPast = isPastEvent(b.event);
      if (aPast && !bPast) return 1;
      if (!aPast && bPast) return -1;
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(a.event.startDate).getTime() -
        new Date(b.event.startDate).getTime()
      );
    });

    return ranked.map((r) => r.event);
  }, [events, debouncedQuery, campusFilter]);

  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-10 sm:py-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto text-center mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Explore Events
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto px-4">
          Discover workshops, hackathons, competitions and more
        </p>
        <div className="mt-6 h-px w-24 mx-auto bg-linear-to-r from-transparent via-purple-500/60 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto mb-10 relative px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-3">
          <svg
            className="w-5 h-5 text-purple-300 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
            />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Search events, tags, categories..."
            className="w-full bg-transparent text-white outline-none text-sm sm:text-base"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 rounded-xl bg-black/70 border border-white/10 backdrop-blur-xl">
            {suggestions.map((s) => (
              <button
                key={s}
                onMouseDown={() => {
                  setQuery(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-500/20 first:rounded-t-xl last:rounded-b-xl"
              >
                {highlight(s, debouncedQuery)}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 mt-4 justify-center flex-wrap">
          {(["ALL", "EC", "RR"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCampusFilter(c)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition active:scale-95 ${
                campusFilter === c
                  ? "bg-purple-500 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {c === "ALL" ? "All Campuses" : c}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filteredEvents.length > 0 && (
        <div className="max-w-7xl mx-auto grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-4">
          {filteredEvents.map((event) => {
            const past = isPastEvent(event);
            return (
              <div
                key={event._id}
                className={`transition ${past ? "opacity-50 grayscale" : "hover:scale-[1.02] active:scale-[0.98]"}`}
              >
                <Link href={`/events/${event._id}`} className="block h-full">
                  <EventCard event={event} query={debouncedQuery} />
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && filteredEvents.length === 0 && (
        <p className="text-center text-[#A3A3A3] mt-10 px-4">
          No events match your search.
        </p>
      )}
    </div>
  );
}
