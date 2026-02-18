import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Event from "@/lib/models/Event";
import { LRUCache } from "lru-cache";

const searchCache = new LRUCache<string, any>({
  max: 50,
  ttl: 1000 * 60 * 2,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cacheKey = searchParams.toString();
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "private, max-age=120",
          "X-Cache": "HIT",
        },
      });
    }

    await connectDB();

    const q = searchParams.get("q");
    const campus = searchParams.get("campus");
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (q?.trim()) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { shortDescription: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
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

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({
          isPinned: -1,
          startDate: 1,
        })
        .select(
          "name shortDescription bannerUrl startDate endDate venue campus categories tags isPinned registration",
        )
        .limit(limit)
        .skip(skip)
        .lean(),
      Event.countDocuments(filter),
    ]);

    const response = {
      events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };

    searchCache.set(cacheKey, response);

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=120",
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Events API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
