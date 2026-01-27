import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { getCurrentUser } from "./server/auth";
import UserMenu from "./components/UserMenu";
import brainIcon from "./images/brain_icons.svg";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: "/images/favicon.ico" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  
  // Extract sequence ID from URL if on a sequence page
  const url = new URL(request.url);
  const sequenceMatch = url.pathname.match(/\/sequences\/(\d+)/);
  const sequenceId = sequenceMatch ? Number(sequenceMatch[1]) : null;
  
  // Check if user can edit this sequence (if on sequence page)
  let canEdit = false;
  if (user && sequenceId) {
    const { canEditSequence } = await import('./server/db-drizzle');
    canEdit = await canEditSequence(sequenceId, user.id) || user.role === 'admin';
  }
  
  return { user, canEdit, sequenceId };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, canEdit, sequenceId } = useLoaderData<typeof loader>();
  const location = useLocation();

  
  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
<img src={brainIcon} alt="Brain" style={{ width: '32px', height: '32px' }} />
<div className="navbar-links">
          <a href="/" className={(location.pathname === '/' || location.pathname.startsWith('/sequences'))? 'selected':''}>
            Brain Sequences
          </a>
          <a href="/brainparts" className={(location.pathname.startsWith('/brainparts'))? 'selected':''}>
            Brain parts
          </a>
          <a href="/about" className={(location.pathname.startsWith('/about'))? 'selected':''}>
            About
          </a>
        </div>
        </div>
        
        <UserMenu user={user} canEdit={canEdit} sequenceId={sequenceId || undefined} />
      </nav>
      
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
