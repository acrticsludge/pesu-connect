import Club from "@/lib/models/Club";

export async function canUserEditEvent(user: any, event: any) {
  if (user.role === "admin") return true;

  const clubIds = event.involvedClubs.map((entry: any) => entry.club);

  const clubs = await Club.find({
    _id: { $in: clubIds },
    ranks: {
      $elemMatch: {
        level: 1,
        "users.srn": user.srn,
      },
    },
  }).lean();

  return clubs.length > 0;
}
