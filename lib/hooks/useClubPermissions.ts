import { useMemo } from "react";
import { getClubEditScope } from "@/lib/permissions/clubPermissions";

export function useClubPermissions(user: any, club: any) {
  return useMemo(() => {
    if (!user || !club) {
      return { scope: null, isLoading: false };
    }

    const scope = getClubEditScope({ user, club });
    return { scope, isLoading: false };
  }, [user, club]);
}
