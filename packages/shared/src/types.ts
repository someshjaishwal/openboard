import type { z } from "zod";
import type {
  createPostSchema,
  loginSchema,
  patchPostSchema,
  postStatuses,
  publicPostStatuses,
  registerSchema,
} from "./schemas.js";

export type PostStatus = (typeof postStatuses)[number];
export type PublicPostStatus = (typeof publicPostStatuses)[number];

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PatchPostInput = z.infer<typeof patchPostSchema>;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type PublicPost = {
  id: string;
  title: string;
  body: string;
  status: PostStatus;
  author: { id: string; name: string };
  voteCount: number;
  votedByMe: boolean;
  createdAt: string;
};

export type Stats = {
  users: number;
  posts: number;
  votes: number;
  byStatus: Record<PostStatus, number>;
};
