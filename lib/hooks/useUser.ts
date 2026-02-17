import { useQuery } from "@tanstack/react-query";

export type User = {
  name: string;
  srn: string;
  email: string;
  role: string;
  profilePic: string | null;
} | null;

async function fetchUser(): Promise<User> {
  const res = await fetch("/api/auth/me");
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.user || null;
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  });
}
