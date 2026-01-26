import type { Club } from "./types/club";

export function isClubHead(club: Club, srn: string) {
  return club.clubLeads.some((l) => l.srn === srn);
}

export function isDomainHead(domain: Club["domains"][number], srn: string) {
  return domain.domainLeads.some((l) => l.srn === srn);
}
