export type ClubEditScope = "NONE" | "DOMAIN" | "CLUB" | "ADMIN";

export function getClubEditScope({ user, club }: { user: any; club: any }) {
  if (!user || !club) return "NONE";

  const srn = user.srn;
  if (!srn) return "NONE";

  if (user.role === "admin") return "ADMIN";

  const isClubLead = club.ranks?.some(
    (rank: any) =>
      rank.level === 1 && rank.users?.some((u: any) => u.srn === srn),
  );

  if (isClubLead) return "CLUB";

  const isDomainLead = club.domains?.some((domain: any) =>
    domain.ranks?.some(
      (rank: any) =>
        rank.level === 1 && rank.users?.some((u: any) => u.srn === srn),
    ),
  );

  if (isDomainLead) return "DOMAIN";

  return "NONE";
}

export function getEditableDomainIndexes({
  user,
  club,
}: {
  user: any;
  club: any;
}): number[] {
  if (!user || !club || !user.srn) return [];

  const srn = user.srn;

  return club.domains
    .map((domain: any, index: number) => {
      const isLead = domain.ranks?.some(
        (rank: any) =>
          rank.level === 1 && rank.users?.some((u: any) => u.srn === srn),
      );
      return isLead ? index : -1;
    })
    .filter((i: number) => i !== -1);
}
