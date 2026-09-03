import { z } from "zod";

export const COOKIE_NAME = "ob_session";

export const postStatuses = ["open", "planned", "shipped", "hidden"] as const;
export const publicPostStatuses = ["open", "planned", "shipped"] as const;

export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const createPostSchema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(5000),
});

export const patchPostSchema = z.object({
  status: z.enum(postStatuses),
});
