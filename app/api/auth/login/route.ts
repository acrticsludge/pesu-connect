import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
});

export async function POST(req: Request) {
  try {
    const { srn, password } = await req.json();

    if (!srn || !password) {
      return NextResponse.json(
        { error: "SRN and password are required" },
        { status: 400 },
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const rateLimitResult = await rateLimiter.check(`login:${ip}`);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
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

    const pesuRes = await fetch("https://pesu-auth.onrender.com/authenticate", {
      method: "POST",
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
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }),
    );

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
