import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";

export async function GET() {
  try {
    await connectDB();

    const clubs = await Club.find({}).sort({ createdAt: -1 });

    return NextResponse.json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return NextResponse.json(
      { message: "Failed to fetch clubs" },
      { status: 500 },
    );
  }
}
