import Club from "@/lib/models/Club";

export async function canUserEditEvent(user: any, event: any) {
  if (user.role === "ADMIN") return true;

  for (const entry of event.involvedClubs) {
    const club = await Club.findById(entry.club);
    if (!club) continue;

    const maxLevel = Math.max(...club.ranks.map((r: any) => r.level));
    const topRanks = club.ranks.filter((r: any) => r.level === maxLevel);

    const isHead = topRanks.some((rank: any) =>
      rank.users.some((u: any) => u.srn === user.srn),
    );

    if (isHead) return true;
  }

  return false;
}
