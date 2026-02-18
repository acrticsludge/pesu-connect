import { useState, useEffect } from "react";
import { Club, ClubDomain, DomainRank } from "@/lib/types/club";

interface UserResponse {
  srn: string;
  name: string;
}

export function useDomainUserNames(
  club: Club | null | undefined,
  domainSlug: string,
) {
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!club) return;

    const activeDomain = (club.domains ?? []).find(
      (d: ClubDomain) => slugify(d.name) === domainSlug,
    );

    if (!activeDomain) return;

    const srns = new Set<string>();

    (activeDomain.ranks ?? []).forEach((r: DomainRank) =>
      (r.users ?? []).forEach((u) => srns.add(u.srn)),
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
  }, [club, domainSlug]);

  return { data: userMap, isLoading };
}

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-");
}
