import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Club from "@/lib/models/Club";
import ClubCreationRequest from "@/lib/models/ClubCreationRequest";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.sub).select("_id name role srn");

    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const request = await ClubCreationRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (
      request.status !== "approved" ||
      request.requestedBy.userId.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        { error: "Invalid request state" },
        { status: 400 },
      );
    }

    const exists = await Club.findOne({ name: request.clubData.name });
    if (exists) {
      return NextResponse.json(
        { message: "Club already exists" },
        { status: 409 },
      );
    }

    const club = await Club.create({
      name: request.clubData.name,
      shortDescription: request.clubData.shortDescription,
      foundedOn: new Date(request.clubData.foundedOn),
      banner: request.clubData.bannerUrl
        ? { url: request.clubData.bannerUrl }
        : undefined,
      instagram: request.clubData.instagram,
      isRecruiting: false,

      staffCoordinator: {
        name: request.clubData.staffName,
        department: request.clubData.staffDepartment,
      },

      ranks: [
        {
          name: "Club Lead",
          level: 1,
          users: [{ srn: user.srn }],
        },
      ],

      domains: [],
    });

    request.status = "completed";
    await request.save();

    return NextResponse.json({ clubId: club._id });
  } catch (err) {
    console.error("Confirm club creation error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
