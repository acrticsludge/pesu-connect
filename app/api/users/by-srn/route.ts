import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { LRUCache } from "lru-cache";

const srnsCache = new LRUCache<string, string[]>({
  max: 1,
  ttl: 1000 * 60 * 5,
});

const userNamesCache = new LRUCache<string, any>({
  max: 50,
  ttl: 1000 * 60 * 5,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.srns || !Array.isArray(body.srns)) {
      return NextResponse.json([]);
    }

    const uniqueSrns = [...new Set(body.srns)].sort().join(",");
    const cached = userNamesCache.get(uniqueSrns);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    const users = await User.find(
      { srn: { $in: body.srns } },
      { srn: 1, name: 1, _id: 0 },
    ).lean();

    userNamesCache.set(uniqueSrns, users);

    return NextResponse.json(users, {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}

export async function GET() {
  try {
    const cached = srnsCache.get("all");
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    await connectDB();

    const users = await User.find().select("srn -_id").lean();

    const srns = users.map((u) => u.srn);

    srnsCache.set("all", srns);

    return NextResponse.json(srns, {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json([]);
  }
}
