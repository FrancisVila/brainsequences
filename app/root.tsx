import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { getCurrentUser } from "./server/auth";

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
  return { user };
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
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <>
      <nav style={{
        padding: '10px 20px',
        backgroundColor: '#343a40',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
            BrainSequences
          </a>
          <a href="/brainparts" style={{ color: 'white', textDecoration: 'none' }}>
            Brain Parts
          </a>
          <a href="/about" style={{ color: 'white', textDecoration: 'none' }}>
            About
          </a>
        </div>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ color: '#adb5bd' }}>{user.email}</span>
              {user.role === 'admin' && (
                <a href="/admin/users" style={{ 
                  color: '#ffc107', 
                  textDecoration: 'none',
                  fontWeight: 'bold'
                }}>
                  Admin
                </a>
              )}
              <a href="/logout" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '5px 15px',
                backgroundColor: '#dc3545',
                borderRadius: '4px'
              }}>
                Logout
              </a>
            </>
          ) : (
            <>
              <a href="/login" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '5px 15px',
                backgroundColor: '#007bff',
                borderRadius: '4px'
              }}>
                Login
              </a>
              <a href="/signup" style={{ 
                color: 'white', 
                textDecoration: 'none',
                padding: '5px 15px',
                backgroundColor: '#28a745',
                borderRadius: '4px'
              }}>
                Sign Up
              </a>
            </>
          )}
        </div>
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
