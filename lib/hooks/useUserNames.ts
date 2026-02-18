import { useState, useEffect } from "react";
import { Club, ClubRank, DomainRank } from "@/lib/types/club";

interface UserResponse {
  srn: string;
  name: string;
}

export function useUserNames(club: Club | null | undefined) {
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!club) return;

    const srns = new Set<string>();

    (club.ranks ?? []).forEach((r: ClubRank) =>
      (r.users ?? []).forEach((u) => srns.add(u.srn)),
    );

    (club.domains ?? []).forEach((d) =>
      (d.ranks ?? []).forEach((r: DomainRank) =>
        (r.users ?? []).forEach((u) => srns.add(u.srn)),
      ),
    );

    if (srns.size === 0) return;

    setIsLoading(true);
    fetch("/api/users/by-srn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ srns: Array.from(srns) }),
    })
      .then((res) => res.json())
      .then((users: UserResponse[]) => {
        const map: Record<string, string> = {};
        users.forEach((u: UserResponse) => {
          map[u.srn] = u.name;
        });
        setUserMap(map);
      })
      .finally(() => setIsLoading(false));
  }, [club]);

  return { data: userMap, isLoading };
}
