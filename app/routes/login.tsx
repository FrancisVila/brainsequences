import { redirect, data } from 'react-router';
import type { Route } from './+types/login';
import { 
  findUserByEmail, 
  verifyPassword, 
  createSession, 
  createSessionCookie,
  getCurrentUser 
} from '~/server/auth.server';

export async function loader({ request }: Route.LoaderArgs) {
  // If already logged in, redirect to home
  const user = await getCurrentUser(request);
  if (user) {
    return redirect('/');
  }
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return data(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    return data(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    return data(
      { error: 'Invalid email or password' },
      { status: 401 }
    );
  }

  // Create session
  const sessionId = await createSession(user.id);

  // Redirect with session cookie
  return redirect('/', {
    headers: {
      'Set-Cookie': createSessionCookie(sessionId),
    },
  });
}

export default function Login({ actionData }: Route.ComponentProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Login</h1>
      
      {actionData?.error && (
        <div style={{ 
          color: 'red', 
          padding: '10px', 
          marginBottom: '20px',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          {actionData.error}
        </div>
      )}

      <form method="post">
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            style={{ 
              width: '100%', 
              padding: '8px', 
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <button
          type="submit"
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Login
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Don't have an account? <a href="/signup">Sign up</a>
      </p>
    </div>
  );
}
