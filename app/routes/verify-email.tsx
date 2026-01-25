import { redirect, data } from 'react-router';
import type { Route } from './+types/verify-email';
import { 
  getCurrentUser,
  createSessionCookie,
  createSession
} from '~/server/auth';
import { 
  getUserByVerificationToken,
  updateUserVerification
} from '~/server/db-drizzle';
import { sendVerificationEmail } from '~/server/email';
import crypto from 'crypto';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const required = url.searchParams.get('required');
  
  const user = await getCurrentUser(request);
  
  // If token provided, verify it
  if (token) {
    const tokenUser = await getUserByVerificationToken(token);
    
    if (!tokenUser) {
      return { error: 'Invalid or expired verification link', user };
    }
    
    if (tokenUser.emailVerified) {
      return { success: 'Email already verified!', user };
    }
    
    // Verify the email
    await updateUserVerification(tokenUser.id, true, null);
    
    // If not logged in, log them in
    if (!user) {
      const sessionId = await createSession(tokenUser.id);
      return redirect('/', {
        headers: {
          'Set-Cookie': createSessionCookie(sessionId),
        },
      });
    }
    
    return { success: 'Email verified successfully!', user };
  }
  
  // Show verification required message
  return { user, required: required === 'true' };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return data({ error: 'Please log in to resend verification email' }, { status: 401 });
  }
  
  if (user.emailVerified) {
    return data({ error: 'Email is already verified' }, { status: 400 });
  }
  
  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await updateUserVerification(user.id, false, verificationToken);
  
  // Send verification email
  await sendVerificationEmail(user.email, verificationToken);
  
  return data({ success: 'Verification email sent! Please check your inbox.' });
}

export default function VerifyEmail({ loaderData, actionData }: Route.ComponentProps) {
  const { user, required, success, error } = loaderData || {};
  
  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }}>
      <h1>Email Verification</h1>
      
      {success && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {success}
        </div>
      )}
      
      {error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}
      
      {actionData?.success && (
        <div style={{
          padding: '15px',
          backgroundColor: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {actionData.success}
        </div>
      )}
      
      {actionData?.error && (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {actionData.error}
        </div>
      )}
      
      {user && !user.emailVerified && !success && (
        <>
          {required && (
            <p style={{ color: '#856404', backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
              You need to verify your email address to continue.
            </p>
          )}
          
          <p>Please check your email ({user.email}) for a verification link.</p>
          <p>Didn't receive the email?</p>
          
          <form method="post">
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Resend Verification Email
            </button>
          </form>
        </>
      )}
      
      {!user && !success && (
        <p>
          Please <a href="/login" style={{ color: '#007bff' }}>log in</a> to verify your email.
        </p>
      )}
      
      {(success || (user && user.emailVerified)) && (
        <p>
          <a href="/" style={{ color: '#007bff' }}>Go to Home</a>
        </p>
      )}
    </div>
  );
}
