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
  const res = await fetch(`/api/auth/me`);
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.status === 401 || res.status === 403) {
        return null;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(
          `Failed to fetch user: ${res.status} ${res.statusText} - ${body}`,
        );
      }
      return res.json();
    } catch (err) {
      throw new Error(`Network or fetch error: ${err}`);
    }
  };
  const data = await res.json();
  return data.user || null;
}

export function useUser() {
  const pathname = usePathname();

  return useQuery({
    queryKey: ["user", pathname],
    queryFn: fetchUser,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
}
