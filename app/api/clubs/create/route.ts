import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Club from "@/lib/models/Club";
import User from "@/lib/models/User";

export async function POST(req: Request) {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  const user = await User.findById(payload.sub);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    name,
    shortDescription,
    foundedOn,
    bannerUrl,
    instagram,
    staffName,
    staffDepartment,
  } = body;

  if (!name || !foundedOn || !staffName || !staffDepartment) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const exists = await Club.findOne({ name });
  if (exists) {
    return NextResponse.json(
      { message: "Club already exists" },
      { status: 409 },
    );
  }

  const club = await Club.create({
    name,
    shortDescription,
    foundedOn: new Date(foundedOn),
    banner: bannerUrl ? { url: bannerUrl } : undefined,
    instagram,
    isRecruiting: false,

    staffCoordinator: {
      name: staffName,
      department: staffDepartment,
    },

    ranks: [
      {
        name: "Club Lead",
        level: 0,
        users: [{ srn: user.srn }],
      },
    ],

    domains: [],
  });

  return NextResponse.json(club);
}
