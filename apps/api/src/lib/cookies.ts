import { COOKIE_NAME } from "@openboard/shared";
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { env } from "../env.js";

const WEEK = 60 * 60 * 24 * 7;

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: WEEK,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    domain: env.cookieDomain,
  });
}

export function clearSessionCookie(c: Context) {
  setCookie(c, COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    domain: env.cookieDomain,
  });
}
