import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BaseEventData } from "@/lib/types/event";

const EVENTS_KEY = "events";

async function fetchEvents(): Promise<BaseEventData[]> {
  const res = await fetch("/api/events");
  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }
  const data = await res.json();
  return data.events || [];
}

export function useEvents() {
  return useQuery({
    queryKey: [EVENTS_KEY],
    queryFn: fetchEvents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: [EVENTS_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch event");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function usePrefetchEvents() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: [EVENTS_KEY],
      queryFn: fetchEvents,
      staleTime: 5 * 60 * 1000,
    });
  };
}
