import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

export type User = {
  _id: string;
  name: string;
  srn: string;
  email: string;
  role: string;
  profilePic: string | null;
} | null;

async function fetchUser(): Promise<User> {
  // Add timestamp to prevent caching
  const res = await fetch(`/api/auth/me?t=${Date.now()}`);
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  return data.user || null;
}

export function useUser() {
  const pathname = usePathname();

  return useQuery({
    queryKey: ["user", pathname], // Include pathname in query key
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false, // Disable window focus refetch
    refetchOnReconnect: false, // Disable reconnect refetch
    retry: false,
  });
}
