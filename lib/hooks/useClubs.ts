import { useQuery } from "@tanstack/react-query";
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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
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
    staleTime: 0,
    gcTime: 0,
    enabled: !!id,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
