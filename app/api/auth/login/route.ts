import { NextResponse } from "next/server";
import { serialize } from "cookie";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";
import { RateLimiter } from "@/lib/rateLimiter";

const rateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
});

function validateSecureConnection(req: Request): string | null {
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  if (process.env.NODE_ENV === "production" && protocol !== "https") {
    return "HTTPS is required for this operation";
  }
  return null;
}

function getClientIP(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    const firstIP = ips[0];
    if (/^[\d.]+$/.test(firstIP) || /^[\da-f:]+$/i.test(firstIP)) {
      return firstIP;
    }
  }
  return req.headers.get("cf-connecting-ip") || "unknown";
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 1) {
    return "Invalid credentials";
  }
  if (password.length > 500) {
    return "Invalid credentials";
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const securityError = validateSecureConnection(req);
    if (securityError) {
      return NextResponse.json({ error: securityError }, { status: 403 });
    }

    const { srn, password } = await req.json();

    if (!srn || !password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 401 });
    }

    const ip = getClientIP(req);

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

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let pesuRes;
    try {
      pesuRes = await fetch("https://pesu-auth.onrender.com/authenticate", {
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
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await pesuRes.json();

    if (!pesuRes.ok || !data.status) {
      return NextResponse.json(
        { error: "Invalid credentials" },
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
