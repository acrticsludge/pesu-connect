import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Club } from "@/lib/types/club";

const CLUBS_KEY = "clubs";

async function fetchClubs(): Promise<Club[]> {
  const res = await fetch("/api/clubs");
  if (!res.ok) {
    throw new Error("Failed to fetch clubs");
  }
  return res.json();
}

export function useClubs() {
  return useQuery({
    queryKey: [CLUBS_KEY],
    queryFn: fetchClubs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: [CLUBS_KEY, id],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch club");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

export function usePrefetchClubs() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: [CLUBS_KEY],
      queryFn: fetchClubs,
      staleTime: 5 * 60 * 1000,
    });
  };
}
