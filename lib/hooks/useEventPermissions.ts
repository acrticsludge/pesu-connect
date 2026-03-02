import { useState, useEffect } from "react";

export function useEventPermissions(event: any, user: any) {
  const [canEdit, setCanEdit] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!event || !user) {
      setIsLoading(false);
      return;
    }

    if (user.role === "admin") {
      setCanEdit(true);
      setIsLoading(false);
      return;
    }

    const checkEditPermission = async () => {
      for (const entry of event.involvedClubs) {
        try {
          const res = await fetch(`/api/clubs/${entry.club._id}`);
          const club = await res.json();

          if (!club) continue;

          const isHead = club.ranks?.some(
            (rank: any) =>
              rank.level === 1 &&
              rank.users?.some((u: any) => u.srn === user.srn),
          );

          if (isHead) {
            setCanEdit(true);
            break;
          }
        } catch (error) {
          console.error("Error checking club permissions:", error);
        }
      }
      setIsLoading(false);
    };

    checkEditPermission();
  }, [event, user]);

  return { canEdit, isLoading };
}
