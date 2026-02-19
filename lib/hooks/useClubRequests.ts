import { useQuery } from "@tanstack/react-query";

async function fetchClubRequests(role: string) {
  const endpoint =
    role === "admin" ? "/api/admin/club-requests" : "/api/club-requests/me";

  const res = await fetch(endpoint);
  if (!res.ok) return [];
  const data = await res.json();
  return data.requests || [];
}

export function useClubRequests(role: string) {
  return useQuery({
    queryKey: ["club-requests", role],
    queryFn: () => fetchClubRequests(role),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
