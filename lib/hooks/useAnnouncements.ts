import { useQuery } from "@tanstack/react-query";

async function fetchAnnouncements() {
  const res = await fetch("/api/announcements");
  if (!res.ok) throw new Error("Failed to fetch announcements");
  const data = await res.json();
  return data.announcements || [];
}

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
