import type { Stats } from "@openboard/shared";
import { apiFetch } from "@/lib/api";

export default async function OverviewPage() {
  const data = await apiFetch<{ stats: Stats; actor: string }>("/admin/stats");
  const { stats } = data;

  return (
    <section>
      <h1>Overview</h1>
      <p className="lede">
        This console is gated by Cloudflare Access in production. Data comes from the Railway
        API, not from Neon directly.
      </p>
      <div className="cards">
        <Stat label="Users" value={stats.users} />
        <Stat label="Posts" value={stats.posts} />
        <Stat label="Votes" value={stats.votes} />
      </div>
      <h2>By status</h2>
      <div className="cards">
        {Object.entries(stats.byStatus).map(([status, count]) => (
          <Stat key={status} label={status} value={count} />
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <article className="stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}
