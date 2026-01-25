import { redirect, data } from 'react-router';
import type { Route } from './+types/signup';
import { 
  findUserByEmail, 
  createUser, 
  createSession, 
  createSessionCookie,
  validatePassword,
  isFirstUser,
  getCurrentUser
} from '~/server/auth';

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
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validation
  if (!email || !password || !confirmPassword) {
    return data(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return data(
      { error: 'Passwords do not match' },
      { status: 400 }
    );
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return data(
      { error: passwordValidation.error },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return data(
      { error: 'An account with this email already exists' },
      { status: 400 }
    );
  }

  // Check if this is the first user (auto-assign admin role)
  const firstUser = await isFirstUser();
  const role = firstUser ? 'admin' : 'user';

  // Create user
  const user = await createUser(email, password, role);

  // Create session
  const sessionId = await createSession(user.id);

  // Redirect with session cookie
  return redirect('/', {
    headers: {
      'Set-Cookie': createSessionCookie(sessionId),
    },
  });
}

export default function Signup({ actionData }: Route.ComponentProps) {
  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Sign Up</h1>
      
      <div style={{ 
        padding: '10px', 
        marginBottom: '20px',
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        Password must be at least 8 characters and contain both letters and numbers.
      </div>

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

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            minLength={8}
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
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={8}
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
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Sign Up
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}
