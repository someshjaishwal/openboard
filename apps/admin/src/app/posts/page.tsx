import { postStatuses, type PublicPost } from "@openboard/shared";
import { apiFetch } from "@/lib/api";
import { StatusForm } from "./status-form";

export default async function PostsPage() {
  const data = await apiFetch<{ posts: PublicPost[] }>("/admin/posts");

  return (
    <section>
      <h1>Posts</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Votes</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.posts.map((post) => (
            <tr key={post.id}>
              <td>
                <div className="title">{post.title}</div>
                <div className="clip">{post.body}</div>
              </td>
              <td>{post.author.name}</td>
              <td>{post.voteCount}</td>
              <td>
                <StatusForm id={post.id} status={post.status} statuses={[...postStatuses]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
