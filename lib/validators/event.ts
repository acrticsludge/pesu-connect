import Club from "@/lib/models/Club";

export function isUserClubHead(userSrn: string, club: any) {
  const maxLevel = Math.max(...club.ranks.map((r: any) => r.level));
  const topRanks = club.ranks.filter((r: any) => r.level === maxLevel);

  return topRanks.some((rank: any) =>
    rank.users.some((u: any) => u.srn === userSrn),
  );
}

export async function validateInvolvedClubs(
  involvedClubs: any[],
  userSrn: string,
) {
  if (!involvedClubs.length) {
    throw new Error("At least one club must be involved");
  }

  for (const entry of involvedClubs) {
    const club = await Club.findById(entry.club);
    if (!club) throw new Error("Invalid club");

    const isHead = club.ranks?.some(
      (rank: any) =>
        rank.level === 1 && rank.users?.some((u: any) => u.srn === userSrn),
    );

    if (!isHead) {
      throw new Error(`Not authorized for ${club.name}`);
    }

    if (!entry.domains || entry.domains.length === 0) {
      throw new Error(`At least one domain required for ${club.name}`);
    }

    const clubDomainNames = club.domains.map((d: any) => d.name);
    const invalidDomains = entry.domains.filter(
      (domainName: string) => !clubDomainNames.includes(domainName),
    );

    if (invalidDomains.length > 0) {
      throw new Error(
        `Invalid domains for ${club.name}: ${invalidDomains.join(", ")}`,
      );
    }
  }
}

export function validateRegistration(reg: any) {
  if (!reg.isRegister) return;

  if (!reg.deadline) {
    throw new Error("Registration deadline is required");
  }

  if (new Date(reg.deadline) <= new Date()) {
    throw new Error("Registration deadline must be in the future");
  }
}

export function validateEventDates(start: Date, end: Date) {
  const now = new Date();

  if (start <= now) {
    throw new Error("Event start date must be in the future");
  }

  if (end < start) {
    throw new Error("Event end date cannot be before start date");
  }
}
