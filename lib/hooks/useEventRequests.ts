import { useQuery } from "@tanstack/react-query";

async function fetchEventRequests(role: string) {
  const endpoint =
    role === "admin"
      ? "/api/admin/events/requests?status=pending"
      : "/api/events/requests/me";

  const res = await fetch(endpoint);
  if (!res.ok) return { requests: [] };
  const data = await res.json();
  return data.requests || [];
}

export function useEventRequests(role: string) {
  return useQuery({
    queryKey: ["event-requests", role],
    queryFn: () => fetchEventRequests(role),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}
