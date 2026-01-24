import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  const { srn, password } = await req.json();

  const pesuRes = await fetch("https://pesu-auth.onrender.com/authenticate", {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: srn,
      password,
      profile: true,
      fields: ["name", "email", "srn"],
    }),
  });

  const data = await pesuRes.json();
  console.log(data);

  if (!pesuRes.ok || !data.status) {
    return NextResponse.json(
      { error: "Invalid SRN or password" },
      { status: 401 },
    );
  }

  const { name, email, srn: verifiedSRN } = data.profile;

  await connectDB();
  let user = await User.findOne({ srn: verifiedSRN });

  if (!user) {
    user = await User.create({
      srn: verifiedSRN,
      name,
      email,
    });
  }

  const token = signToken({
    sub: user._id.toString(),
    srn: user.srn,
    role: user.role,
  });

  const res = NextResponse.json({ success: true });

  res.headers.set(
    "Set-Cookie",
    serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }),
  );

  return res;
}
