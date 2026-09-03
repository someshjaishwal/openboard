"use client";

import { useTransition } from "react";
import type { PostStatus } from "@openboard/shared";
import { updatePostStatus } from "./actions";

export function StatusForm({
  id,
  status,
  statuses,
}: {
  id: string;
  status: PostStatus;
  statuses: PostStatus[];
}) {
  const [pending, start] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(event) => {
        const next = event.target.value as PostStatus;
        start(async () => {
          await updatePostStatus(id, next);
        });
      }}
    >
      {statuses.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
