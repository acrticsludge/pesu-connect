import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import ClubCreationRequest from "@/lib/models/ClubCreationRequest";

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.sub).select("name srn email role");

    const existingRequest = await ClubCreationRequest.findOne({
      "requestedBy.userId": user._id,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          message:
            "You already have an active club creation request. Please wait for it to be resolved.",
        },
        { status: 409 },
      );
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can send club requests" },
        { status: 403 },
      );
    }

    const body = await req.json();

    const request = await ClubCreationRequest.create({
      clubData: {
        name: body.name,
        shortDescription: body.shortDescription,
        foundedOn: body.foundedOn,
        bannerUrl: body.bannerUrl,
        instagram: body.instagram,
        staffName: body.staffName,
        staffDepartment: body.staffDepartment,
      },
      requestedBy: {
        userId: user._id,
        name: user.name,
        srn: user.srn,
        email: user.email,
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    console.error("Club request error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
