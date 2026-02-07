import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";

import Event from "@/lib/models/Event";

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");
  const campus = searchParams.get("campus");
  const category = searchParams.get("category");

  const filter: any = {};

  if (q) {
    filter.$text = { $search: q };
  }

  if (campus) {
    filter.campus = campus;
  }

  if (category) {
    filter.category = category;
  }

  const events = await Event.find(filter)
    .sort({
      isPinned: -1, // pinned first
      startDate: 1, // upcoming first
    })
    .select(
      "name shortDescription bannerUrl startDate endDate venue campus category tag isPinned",
    );

  return NextResponse.json({ events });
}
