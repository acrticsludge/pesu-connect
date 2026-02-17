import { useMemo } from "react";
import { BaseEventData } from "@/lib/types/event";

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

export function useSearchSuggestions(events: BaseEventData[], query: string) {
  return useMemo(() => {
    if (!query.trim()) return [];
    const set = new Set<string>();
    events.forEach((e) => {
      if (fuzzyMatch(query, e.name)) set.add(e.name);
      e.tags?.forEach((t) => {
        if (fuzzyMatch(query, t)) set.add(t);
      });
      e.categories?.forEach((c) => {
        if (fuzzyMatch(query, c)) set.add(c);
      });
    });
    return Array.from(set).slice(0, 6);
  }, [events, query]);
}
