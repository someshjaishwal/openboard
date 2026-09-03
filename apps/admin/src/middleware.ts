import { createRemoteJWKSet } from "jose/jwks/remote";
import { jwtVerify } from "jose/jwt/verify";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.delete("x-access-jwt");
  requestHeaders.delete("x-access-email");

  if (process.env.ADMIN_DEV_BYPASS === "true") {
    requestHeaders.set("x-access-email", "dev@local");
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token =
    req.headers.get("cf-access-jwt-assertion") ??
    req.cookies.get("CF_Authorization")?.value;

  if (!token) {
    return new NextResponse("Missing Cloudflare Access token", { status: 401 });
  }

  const team = process.env.CF_ACCESS_TEAM_DOMAIN;
  const aud = process.env.CF_ACCESS_AUD;
  if (!team || !aud) {
    return new NextResponse("Access is not configured", { status: 500 });
  }

  try {
    const issuer = team.replace(/\/$/, "");
    const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, jwks, {
      issuer,
      audience: aud,
    });
    requestHeaders.set("x-access-jwt", token);
    requestHeaders.set("x-access-email", String(payload.email ?? ""));
    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return new NextResponse("Invalid Cloudflare Access token", { status: 401 });
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
