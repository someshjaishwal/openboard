import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicPost } from "@openboard/shared";
import { api } from "../api";
import { useAuth } from "../auth";
import { PostCard } from "../components/PostCard";

export function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState<PublicPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .post(id)
      .then((data) => setPost(data.post))
      .catch((err) => setError(err instanceof Error ? err.message : "not found"));
  }, [id]);

  async function onVote(postId: string) {
    const result = await api.vote(postId);
    setPost((current) =>
      current
        ? { ...current, voteCount: result.voteCount, votedByMe: result.voted }
        : current,
    );
  }

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p className="muted">Loading…</p>;

  return (
    <section className="narrow">
      <PostCard post={post} onVote={user ? onVote : undefined} />
      {!user ? <p className="muted">Sign in to vote on this request.</p> : null}
    </section>
  );
}
