import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import ClubCreationRequest from "@/lib/models/ClubCreationRequest";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
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

    const admin = await User.findById(payload.sub).select("role name");
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { action, remark } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const request = await ClubCreationRequest.findById(params.id);
    if (!request || request.status !== "pending") {
      return NextResponse.json(
        { error: "Request not found or already handled" },
        { status: 404 },
      );
    }

    request.status = action === "approve" ? "approved" : "rejected";
    request.adminRemark = remark;
    request.handledBy = {
      adminId: admin._id,
      name: admin.name,
    };

    await request.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Handle club request error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
