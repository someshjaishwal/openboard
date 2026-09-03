"use server";

import { revalidatePath } from "next/cache";
import type { PostStatus } from "@openboard/shared";
import { apiFetch } from "@/lib/api";

export async function updatePostStatus(id: string, status: PostStatus) {
  await apiFetch(`/admin/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  revalidatePath("/posts");
  revalidatePath("/");
}
