import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export type JWTPayload = {
  sub: string; // user id
  srn: string;
  role: string;
};

export function signToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}
