import type { PublicUser } from "@openboard/shared";
import { apiFetch } from "@/lib/api";

export default async function UsersPage() {
  const data = await apiFetch<{ users: PublicUser[] }>("/admin/users");

  return (
    <section>
      <h1>Users</h1>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
