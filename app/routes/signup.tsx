import { redirect, data } from 'react-router';
import type { Route } from './+types/signup';
import { useState } from 'react';
import HCaptcha from '~/components/HCaptcha';
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
  return { 
    hcaptchaSiteKey: process.env.HCAPTCHA_SITE_KEY || '' 
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const captchaToken = formData.get('h-captcha-response') as string;

  // Validation
  if (!email || !password || !confirmPassword) {
    return data(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  // Verify CAPTCHA
  if (!captchaToken) {
    return data(
      { error: 'Please complete the CAPTCHA verification' },
      { status: 400 }
    );
  }

  // Verify CAPTCHA with hCaptcha servers
  const hcaptchaSecret = process.env.HCAPTCHA_SECRET;
  if (!hcaptchaSecret) {
    console.error('HCAPTCHA_SECRET not configured');
    return data(
      { error: 'Server configuration error. Please contact support.' },
      { status: 500 }
    );
  }

  const verifyUrl = 'https://hcaptcha.com/siteverify';
  const verifyResponse = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: hcaptchaSecret,
      response: captchaToken,
    }),
  });

  const verifyData = await verifyResponse.json();
  if (!verifyData.success) {
    console.error('hCaptcha verification failed:', verifyData);
    return data(
      { error: `CAPTCHA verification failed. Please try again.${verifyData['error-codes'] ? ' Error: ' + verifyData['error-codes'].join(', ') : ''}` },
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

export default function Signup({ loaderData, actionData }: Route.ComponentProps) {
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

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

        <div style={{ marginBottom: '20px' }}>
          <HCaptcha sitekey={loaderData.hcaptchaSiteKey} onVerify={setCaptchaToken} />
        </div>

        <button
          type="submit"
          disabled={!captchaToken}
          style={{ 
            width: '100%', 
            padding: '10px', 
            fontSize: '16px',
            backgroundColor: captchaToken ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: captchaToken ? 'pointer' : 'not-allowed'
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
