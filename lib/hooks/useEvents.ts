import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BaseEventData } from "@/lib/types/event";

const EVENTS_KEY = "events";

async function fetchEvents(): Promise<BaseEventData[]> {
  const res = await fetch(`/api/events`);
  if (!res.ok) {
    throw new Error("Failed to fetch events");
  }
  const data = await res.json();
  return data.events || [];
}

export function useEvents() {
  return useQuery<BaseEventData[]>({
    queryKey: [EVENTS_KEY],
    queryFn: fetchEvents,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: [EVENTS_KEY, id],
    queryFn: async () => {
      if (!id || id === "undefined") {
        throw new Error("Invalid event ID");
      }
      const res = await fetch(`/api/events/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch event");
      }
      const data = await res.json();
      return data.event || data;
    },
    enabled: !!id && id !== "undefined",
    retry: 1,
  });
}

export function usePrefetchEvents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: [EVENTS_KEY],
      queryFn: fetchEvents,
      staleTime: 0,
    });
  };
}
