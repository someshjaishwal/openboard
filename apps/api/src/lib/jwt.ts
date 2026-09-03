import { SignJWT, jwtVerify } from "jose";
import { env } from "../env.js";

const secret = new TextEncoder().encode(env.jwtSecret);

export type SessionClaims = {
  sub: string;
  email: string;
  name: string;
};

export async function signSession(claims: SessionClaims) {
  return new SignJWT({ email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
  const sub = payload.sub;
  const email = payload.email;
  const name = payload.name;
  if (!sub || typeof email !== "string" || typeof name !== "string") {
    throw new Error("invalid session");
  }
  return { sub, email, name };
}
