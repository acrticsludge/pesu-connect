"use client";

import { useMemo, useState } from "react";
import ClubCard from "../Cards/ClubCards/ClubCard";
import Link from "next/link";
import { useClubs } from "@/lib/hooks/useClubs";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useClubSuggestions } from "@/lib/hooks/useClubSuggestions";

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

export default function ClubsPage() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebounce(query, 250);
  const { data: clubs = [], isLoading } = useClubs();
  const suggestions = useClubSuggestions(clubs, debouncedQuery);

  const filteredClubs = useMemo(() => {
    const ranked = clubs
      .map((club) => {
        let score = 0;
        if (fuzzyMatch(debouncedQuery, club.name)) score += 6;
        if (
          club.shortDescription &&
          fuzzyMatch(debouncedQuery, club.shortDescription)
        )
          score += 3;
        club.domains?.forEach((d) => {
          if (fuzzyMatch(debouncedQuery, d.name)) score += 5;
        });
        return { club, score };
      })
      .filter((item) => !debouncedQuery.trim() || item.score > 0)
      .sort((a, b) => {
        if (a.club.isRecruiting && !b.club.isRecruiting) return -1;
        if (!a.club.isRecruiting && b.club.isRecruiting) return 1;
        return b.score - a.score;
      });

    return ranked.map((item) => item.club);
  }, [debouncedQuery, clubs]);

  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-10 sm:py-12 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Explore Our Clubs
        </h1>

        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto px-4">
          Find communities that match your interests
        </p>

        <Link href="/clubs/new">
          <button className="px-6 sm:px-7 py-2.5 sm:py-3 mt-5 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-[0.97] transition hover:bg-[#6D28D9]">
            Create Club
          </button>
        </Link>

        <div className="mt-5 sm:mt-6 h-px w-20 sm:w-24 mx-auto bg-linear-to-r from-transparent via-purple-500/60 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto mb-8 sm:mb-10 relative px-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 px-4 py-3 shadow-[0_10px_40px_rgba(124,58,237,0.25)]">
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
            placeholder="Search clubs, domains, interests..."
            className="w-full bg-transparent text-white placeholder:text-[#A3A3A3] outline-none text-sm sm:text-base"
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 rounded-xl overflow-hidden bg-black/70 backdrop-blur-xl border border-white/10 shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={() => {
                  setQuery(s);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-500/20 transition first:pt-3 last:pb-3"
              >
                {highlight(s, debouncedQuery)}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && filteredClubs.length > 0 && (
        <div className="max-w-7xl mx-auto grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 px-4">
          {filteredClubs.map((club) => (
            <Link
              key={club._id}
              href={`/clubs/${club._id}`}
              className="block h-full transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <ClubCard club={club} query={debouncedQuery} />
            </Link>
          ))}
        </div>
      )}

      {!isLoading && filteredClubs.length === 0 && (
        <p className="text-center text-[#A3A3A3] mt-8 sm:mt-10 px-4">
          No clubs match your search.
        </p>
      )}
    </div>
  );
}
