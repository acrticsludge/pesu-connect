import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import Event from "@/lib/models/Event";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const campus = searchParams.get("campus");
  const category = searchParams.get("category");
  const tag = searchParams.get("tag");

  const filter: any = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (campus) {
    filter.campus = campus;
  }

  if (category) {
    filter.categories = category;
  }

  if (tag) {
    filter.tags = tag;
  }

  const events = await Event.find(filter)
    .sort({
      isPinned: -1,
      startDate: 1,
    })
    .select(
      "name shortDescription bannerUrl startDate endDate venue campus categories tags isPinned registration",
    )
    .lean();

  return NextResponse.json({ events });
}
