import { useQuery } from "@tanstack/react-query";
import { BaseEventData } from "@/lib/types/event";

const CLUB_EVENTS_KEY = "club-events";

async function fetchClubEvents(): Promise<BaseEventData[]> {
  const res = await fetch(`/api/events/club-events`);
  if (!res.ok) {
    throw new Error("Failed to fetch club events");
  }
  const data = await res.json();
  return data.events || [];
}

export function useClubEvents() {
  return useQuery<BaseEventData[]>({
    queryKey: [CLUB_EVENTS_KEY],
    queryFn: fetchClubEvents,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  });
}
