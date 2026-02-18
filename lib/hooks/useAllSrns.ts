import { useQuery } from "@tanstack/react-query";

async function fetchAllSrns() {
  const res = await fetch("/api/users/by-srn");
  if (!res.ok) return [];
  return res.json();
}

export function useAllSrns() {
  return useQuery({
    queryKey: ["all-srns"],
    queryFn: fetchAllSrns,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
