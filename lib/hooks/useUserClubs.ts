import { useQuery } from "@tanstack/react-query";

export function useUserClubs(user: any, clubs: any[]) {
  return useQuery({
    queryKey: ["userClubs", user?.srn],
    queryFn: () => {
      if (!user || !clubs.length) return [];

      const userClubRoles: any[] = [];
      for (const club of clubs) {
        const clubRanks: string[] = [];
        const domainRoles: { domain: string; ranks: string[] }[] = [];

        for (const rank of club.ranks || []) {
          if (rank.users?.some((u: any) => u.srn === user.srn)) {
            clubRanks.push(rank.name);
          }
        }

        for (const domain of club.domains || []) {
          const domainRankNames: string[] = [];
          for (const rank of domain.ranks || []) {
            if (rank.users?.some((u: any) => u.srn === user.srn)) {
              domainRankNames.push(rank.name);
            }
          }
          if (domainRankNames.length > 0) {
            domainRoles.push({
              domain: domain.name,
              ranks: domainRankNames,
            });
          }
        }

        if (clubRanks.length > 0 || domainRoles.length > 0) {
          userClubRoles.push({
            club,
            roles: {
              clubRanks,
              domainRoles,
            },
          });
        }
      }
      return userClubRoles;
    },
    enabled: !!user && clubs.length > 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 0,
  });
}
