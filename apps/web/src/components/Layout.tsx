import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="mast">
        <Link to="/" className="brand">
          <span className="pin" aria-hidden />
          OpenBoard
        </Link>
        <nav>
          <NavLink to="/" end>
            Board
          </NavLink>
          {user ? (
            <>
              <NavLink to="/new">Post a request</NavLink>
              <button type="button" className="text-btn" onClick={() => void logout()}>
                Sign out
              </button>
              <span className="who">{user.name}</span>
            </>
          ) : (
            <>
              <NavLink to="/login">Sign in</NavLink>
              <NavLink to="/register" className="cta">
                Join
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer>
        Public feedback board. Operators use a separate admin behind Cloudflare Access.
      </footer>
    </div>
  );
}
