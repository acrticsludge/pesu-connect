import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.srns || !Array.isArray(body.srns)) {
    return NextResponse.json([]);
  }

  await connectDB();

  const users = await User.find(
    { srn: { $in: body.srns } },
    { srn: 1, name: 1 },
  );

  return NextResponse.json(users);
}

export async function GET() {
  await connectDB();
  const users = await User.find().select("srn").lean();
  return NextResponse.json(users.map((u) => u.srn));
}
