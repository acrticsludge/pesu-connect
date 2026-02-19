import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import EventCreationRequest from "@/lib/models/EventCreationRequest";
import Club from "@/lib/models/Club";
import {
  validateRegistration,
  validateEventDates,
} from "@/lib/validators/event";
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 10,
});

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await rateLimiter.check(
      `event-request-${payload.sub}`,
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many event requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        },
      );
    }

    await connectDB();

    const user = await User.findById(payload.sub).lean();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Admins must use direct event creation" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      involvedClubs,
      registration,
      startDate,
      endDate,
      categories,
      tags,
    } = body;

    const pendingRequest = await EventCreationRequest.findOne({
      "requestedBy.srn": user.srn,
      status: "pending",
    }).lean();

    if (pendingRequest) {
      return NextResponse.json(
        { error: "You already have a pending event request" },
        { status: 400 },
      );
    }

    validateRegistration(registration);
    validateEventDates(new Date(startDate), new Date(endDate));

    const resolvedInvolvedClubs = await Promise.all(
      involvedClubs.map(async (ic: any) => {
        const club = await Club.findById(ic.club);
        if (!club) throw new Error("Club not found");

        const isHead = club.ranks?.some(
          (rank: any) =>
            rank.level === 1 &&
            rank.users?.some((u: any) => u.srn === user.srn),
        );

        if (!isHead) {
          throw new Error(`Not authorized for ${club.name}`);
        }

        if (!ic.domains || ic.domains.length === 0) {
          throw new Error(`At least one domain required for ${club.name}`);
        }

        // Validate that all domain names exist in the club
        const validDomains = ic.domains.every((domainName: string) =>
          club.domains.some((d: any) => d.name === domainName),
        );

        if (!validDomains) {
          throw new Error(`Invalid domains selected for ${club.name}`);
        }

        return {
          club: ic.club,
          domains: ic.domains, // Store domain names directly
        };
      }),
    );

    const transformedBody = {
      ...body,
      categories: body.categories,
      tags: body.tags,
      involvedClubs: resolvedInvolvedClubs,
    };

    const request = await EventCreationRequest.create({
      eventData: transformedBody,
      requestedBy: {
        userId: user._id,
        name: user.name,
        srn: user.srn,
        email: user.email,
      },
      status: "pending",
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        request,
        message: "Event request submitted successfully",
      },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      },
    );
  } catch (err: any) {
    console.error("Event request error:", err);
    return NextResponse.json(
      { error: err.message || "Event creation failed" },
      { status: 400 },
    );
  }
}
