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
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
