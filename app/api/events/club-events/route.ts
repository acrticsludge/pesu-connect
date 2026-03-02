import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";

export async function GET(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all clubs where user is a level 1 member
    const userClubs = await Club.find({
      ranks: {
        $elemMatch: {
          level: 1,
          "users.srn": user.srn,
        },
      },
    }).lean();

    const clubIds = userClubs.map((club) => club._id);

    if (clubIds.length === 0) {
      return NextResponse.json({ events: [] });
    }

    // Find all events where any of these clubs are involved
    const events = await Event.find({
      "involvedClubs.club": { $in: clubIds },
    })
      .lean()
      .sort({ startDate: -1 });

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error("Fetch club events error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch events" },
      { status: 400 },
    );
  }
}
