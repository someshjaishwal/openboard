"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section>
      <h1>API unreachable</h1>
      <p className="lede">{error.message}</p>
      <p className="lede">
        Is the API running, and does <code>API_URL</code> point at it? Local default is
        http://localhost:3100.
      </p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
