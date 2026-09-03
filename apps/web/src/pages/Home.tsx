import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PublicPost, PublicPostStatus } from "@openboard/shared";
import { publicPostStatuses } from "@openboard/shared";
import { api } from "../api";
import { useAuth } from "../auth";
import { PostCard } from "../components/PostCard";

export function Home() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PublicPostStatus | "all">("all");
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(next: PublicPostStatus | "all" = status) {
    try {
      const data = await api.posts(next === "all" ? undefined : next);
      setPosts(data.posts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load");
    }
  }

  useEffect(() => {
    void load(status);
  }, [status]);

  async function onVote(id: string) {
    if (!user) return;
    const result = await api.vote(id);
    setPosts((current) =>
      current.map((post) =>
        post.id === id
          ? { ...post, voteCount: result.voteCount, votedByMe: result.voted }
          : post,
      ),
    );
  }

  return (
    <section>
      <div className="hero">
        <p className="eyebrow">What should we build next?</p>
        <h1>Pin a request. Vote on the rest.</h1>
        <p className="lede">
          OpenBoard is a public feedback wall. Sign in to post and vote; shipped work stays
          on the board so you can see what moved.
        </p>
      </div>
      <div className="toolbar">
        <div className="filters">
          <button
            type="button"
            className={status === "all" ? "on" : ""}
            onClick={() => setStatus("all")}
          >
            All
          </button>
          {publicPostStatuses.map((value) => (
            <button
              key={value}
              type="button"
              className={status === value ? "on" : ""}
              onClick={() => setStatus(value)}
            >
              {value}
            </button>
          ))}
        </div>
        {user ? (
          <Link className="cta" to="/new">
            New request
          </Link>
        ) : (
          <Link className="cta" to="/register">
            Join to post
          </Link>
        )}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <div className="grid">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onVote={user ? onVote : undefined} />
        ))}
      </div>
      {posts.length === 0 && !error ? (
        <p className="muted empty">Nothing on the board yet for this filter.</p>
      ) : null}
    </section>
  );
}
