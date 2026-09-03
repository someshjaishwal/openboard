import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export function NewPost() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const data = await api.createPost({
        title: String(form.get("title")),
        body: String(form.get("body")),
      });
      navigate(`/posts/${data.post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not post");
    }
  }

  return (
    <section className="narrow">
      <h1>Pin a request</h1>
      <form onSubmit={onSubmit} className="stack">
        <label>
          Title
          <input name="title" required maxLength={120} placeholder="Dark mode for the board" />
        </label>
        <label>
          Why it matters
          <textarea name="body" required maxLength={5000} rows={6} />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="cta">
          Publish
        </button>
      </form>
    </section>
  );
}
