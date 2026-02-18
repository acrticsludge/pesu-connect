import { useMemo } from "react";
import { Club } from "@/lib/types/club";

function fuzzyMatch(query: string, text: string) {
  const q = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  const t = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
  if (!q) return false;
  if (t.includes(q)) return true;
  const qWords = q.split(" ").filter(Boolean);
  const tWords = t.split(" ").filter(Boolean);
  return qWords.every((qw) => tWords.some((tw) => tw.includes(qw)));
}

export function useClubSuggestions(clubs: Club[], query: string) {
  return useMemo(() => {
    if (!query.trim()) return [];
    const set = new Set<string>();
    clubs.forEach((club) => {
      if (fuzzyMatch(query, club.name)) set.add(club.name);
      club.domains?.forEach((d) => {
        if (fuzzyMatch(query, d.name)) set.add(d.name);
      });
    });
    return Array.from(set).slice(0, 6);
  }, [clubs, query]);
}
