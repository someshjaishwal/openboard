import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../env.js";

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!env.cfAccessTeamDomain) {
    throw new Error("CF_ACCESS_TEAM_DOMAIN is not set");
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${env.cfAccessTeamDomain.replace(/\/$/, "")}/cdn-cgi/access/certs`),
    );
  }
  return jwks;
}

export async function verifyAccessJwt(token: string) {
  const issuer = env.cfAccessTeamDomain.replace(/\/$/, "");
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer,
    audience: env.cfAccessAud,
  });
  const email = typeof payload.email === "string" ? payload.email : "";
  return { email, sub: payload.sub ?? "" };
}
