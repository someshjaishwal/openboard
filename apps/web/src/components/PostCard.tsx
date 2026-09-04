import { Link } from "react-router-dom";
import type { PublicPost } from "@openboard/shared";

const labels: Record<string, string> = {
  open: "Open",
  planned: "Planned",
  shipped: "Shipped",
  hidden: "Hidden",
};

export function PostCard({
  post,
  onVote,
}: {
  post: PublicPost;
  onVote?: (id: string) => void;
}) {
  return (
    <article className={`card status-${post.status}`}>
      <div className="card-meta">
        <span className={`chip ${post.status}`}>{labels[post.status] ?? post.status}</span>
        <span className="muted">{post.author?.name ?? "Unknown"}</span>
      </div>
      <h2>
        <Link to={`/posts/${post.id}`}>{post.title}</Link>
      </h2>
      <p>{post.body}</p>
      <div className="card-actions">
        <button
          type="button"
          className={post.votedByMe ? "vote on" : "vote"}
          onClick={() => onVote?.(post.id)}
          disabled={!onVote}
        >
          ▲ {post.voteCount}
        </button>
        <time dateTime={post.createdAt}>
          {new Date(post.createdAt).toLocaleDateString()}
        </time>
      </div>
    </article>
  );
}
