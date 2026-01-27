"use client";

import { useEffect, useMemo, useState } from "react";
import ClubCard from "../Cards/ClubCards/ClubCard";
import { Club } from "@/lib/types/club";
import Link from "next/link";

function useDebounce<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[a.length][b.length];
}

function fuzzyMatch(query: string, text: string) {
  const q = normalize(query);
  const t = normalize(text);

  if (!q) return true;
  if (t.includes(q)) return true;

  const qWords = q.split(" ");
  const tWords = t.split(" ");

  return qWords.every((qw) =>
    tWords.some((tw) => tw.includes(qw) || levenshtein(qw, tw) <= 2),
  );
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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debouncedQuery = useDebounce(query);

  useEffect(() => {
    fetch("/api/clubs")
      .then((res) => res.json())
      .then((data) => {
        setClubs(data);
        setLoading(false);
      });
  }, []);

  const filteredClubs = useMemo(() => {
    const ranked = clubs
      .map((club) => {
        let score = 0;

        if (fuzzyMatch(debouncedQuery, club.name)) score += 6;

        if (
          club.shortDescription &&
          fuzzyMatch(debouncedQuery, club.shortDescription)
        ) {
          score += 3;
        }

        club.domains.forEach((d) => {
          if (fuzzyMatch(debouncedQuery, d.name)) score += 5;
        });

        return { club, score };
      })
      .filter((item) => !debouncedQuery.trim() || item.score > 0);

    ranked.sort((a, b) => {
      if (a.club.isRecruiting && !b.club.isRecruiting) return -1;
      if (!a.club.isRecruiting && b.club.isRecruiting) return 1;
      return b.score - a.score;
    });

    return ranked.map((item) => item.club);
  }, [debouncedQuery, clubs]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery.trim()) return [];

    const set = new Set<string>();

    clubs.forEach((club) => {
      if (fuzzyMatch(debouncedQuery, club.name)) {
        set.add(club.name);
      }

      club.domains.forEach((d) => {
        if (fuzzyMatch(debouncedQuery, d.name)) {
          set.add(d.name);
        }
      });
    });

    return Array.from(set).slice(0, 6);
  }, [debouncedQuery, clubs]);

  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-10 sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-80 w-80 sm:h-96 sm:w-96 rounded-full bg-purple-600/20 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Explore Our Clubs
        </h1>

        <p className="mt-2 sm:mt-3 text-sm sm:text-base text-[#A3A3A3] max-w-xl mx-auto">
          Find communities that match your interests
        </p>
        <Link href="/clubs/new">
          <button className="px-7 py-3 mt-5 bg-[#7C3AED] text-white rounded-full font-bold text-sm sm:text-lg active:scale-[0.97] cursor-pointer">
            Create Club
          </button>
        </Link>
        <div className="mt-5 sm:mt-6 h-px w-20 sm:w-24 mx-auto bg-linear-to-r from-transparent via-purple-500/60 to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto mb-8 sm:mb-10 relative">
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
                className="w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-500/20 transition"
              >
                {highlight(s, debouncedQuery)}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <p className="text-center text-[#A3A3A3]">Loading clubs...</p>
      )}

      {!loading && (
        <div className="max-w-7xl mx-auto grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <Link
              key={club._id}
              href={`/clubs/${club._id}`}
              className="block h-full"
            >
              <ClubCard club={club} query={debouncedQuery} />
            </Link>
          ))}
        </div>
      )}

      {!loading && filteredClubs.length === 0 && (
        <p className="text-center text-[#A3A3A3] mt-8 sm:mt-10">
          No clubs match your search.
        </p>
      )}
    </div>
  );
}
