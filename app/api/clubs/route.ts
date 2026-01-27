/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function GET() {
  try {
    await connectDB();

    const clubs = await Club.find({}).sort({ createdAt: -1 }).lean();

    const normalized = clubs.map((club) => ({
      ...club,
      ranks: (club.ranks ?? []).map((r: any) => ({
        name: r.name,
        level: r.level,
        users: r.users ?? [],
      })),
      domains: (club.domains ?? []).map((d: any) => ({
        name: d.name,
        description: d.description,
        ranks: (d.ranks ?? []).map((r: any) => ({
          name: r.name,
          level: r.level,
          users: r.users ?? [],
        })),
      })),
    }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { message: "Failed to fetch clubs" },
      { status: 500 },
    );
  }
}
