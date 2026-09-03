import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "OpenBoard Admin",
  description: "Operator console for OpenBoard",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const actor = h.get("x-access-email") ?? "unknown";

  return (
    <html lang="en">
      <body>
        <div className="frame">
          <aside>
            <p className="logo">OB / ops</p>
            <nav>
              <Link href="/">Overview</Link>
              <Link href="/posts">Posts</Link>
              <Link href="/users">Users</Link>
            </nav>
            <p className="actor">{actor}</p>
          </aside>
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
