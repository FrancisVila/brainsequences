import { redirect, data } from 'react-router';
import type { Route } from './+types/accept';

export async function loader({ request }: Route.LoaderArgs) {
  // Dynamic imports to keep server code on server
  const { getCurrentUser } = await import('~/server/auth.server');
  const { getInvitationByToken } = await import('~/server/db-drizzle.server');
  
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return { error: 'Invalid invitation link' };
  }
  
  // Get invitation details
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    return { error: 'Invitation not found' };
  }
  
  // Check if already accepted
  if (invitation.invitation.acceptedAt) {
    return { error: 'This invitation has already been accepted' };
  }
  
  // Check if expired
  if (invitation.invitation.expiresAt < Date.now()) {
    return { error: 'This invitation has expired', canResend: true };
  }
  
  // Check if user is logged in
  const user = await getCurrentUser(request);
  
  return {
    invitation: {
      email: invitation.invitation.email,
      sequenceTitle: invitation.sequenceTitle,
      inviterEmail: invitation.inviterEmail,
      expiresAt: invitation.invitation.expiresAt,
    },
    token,
    user,
  };
}

export async function action({ request }: Route.ActionArgs) {
  // Dynamic imports to keep server code on server
  const { requireAuth } = await import('~/server/auth.server');
  const { getInvitationByToken, markInvitationAccepted, addCollaborator } = await import('~/server/db-drizzle.server');
  
  const formData = await request.formData();
  const token = formData.get('token') as string;
  
  if (!token) {
    return data({ error: 'Invalid invitation' }, { status: 400 });
  }
  
  // Require user to be logged in
  const user = await requireAuth(request);
  
  // Get invitation
  const invitation = await getInvitationByToken(token);
  
  if (!invitation) {
    return data({ error: 'Invitation not found' }, { status: 404 });
  }
  
  // Verify the logged-in user's email matches the invitation
  if (user.email !== invitation.invitation.email) {
    return data({ 
      error: `This invitation was sent to ${invitation.invitation.email}. You are logged in as ${user.email}. Please log out and log in with the correct account, or sign up with ${invitation.invitation.email}.` 
    }, { status: 403 });
  }
  
  // Check if already accepted
  if (invitation.invitation.acceptedAt) {
    return data({ error: 'This invitation has already been accepted' }, { status: 400 });
  }
  
  // Check if expired
  if (invitation.invitation.expiresAt < Date.now()) {
    return data({ error: 'This invitation has expired' }, { status: 400 });
  }
  
  // Add user as collaborator
  await addCollaborator({
    sequenceId: invitation.invitation.sequenceId,
    userId: user.id,
    permissionLevel: 'editor',
  });
  
  // Mark invitation as accepted
  await markInvitationAccepted(token);
  
  // Redirect to the sequence
  return redirect(`/sequences/${invitation.invitation.sequenceId}`);
}

export default function AcceptInvitation({ loaderData, actionData }: Route.ComponentProps) {
  const { error, canResend, invitation, token, user } = loaderData || {};
  
  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <h1>Invitation Error</h1>
        <div style={{ 
          color: 'red', 
          padding: '15px', 
          marginBottom: '20px',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          {error}
        </div>
        
        {canResend && (
          <p>
            The invitation has expired. Please ask the sequence owner to send you a new invitation.
          </p>
        )}
        
        <p>
          <a href="/">Go to Home</a>
        </p>
      </div>
    );
  }
  
  if (!invitation) {
    return (
      <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
        <h1>Loading...</h1>
      </div>
    );
  }
  
  const expiresDate = new Date(invitation.expiresAt).toLocaleDateString();
  
  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Collaboration Invitation</h1>
      
      {actionData?.error && (
        <div style={{ 
          color: 'red', 
          padding: '15px', 
          marginBottom: '20px',
          border: '1px solid red',
          borderRadius: '4px'
        }}>
          {actionData.error}
        </div>
      )}
      
      <div style={{ 
        padding: '20px', 
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px'
      }}>
        <p><strong>{invitation.inviterEmail}</strong> has invited you to collaborate on:</p>
        <h2 style={{ margin: '10px 0' }}>{invitation.sequenceTitle}</h2>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Invitation sent to: {invitation.email}
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Expires: {expiresDate}
        </p>
      </div>
      
      {!user ? (
        <div>
          <p>You must be logged in to accept this invitation.</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <a 
              href={`/login?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}
              style={{ 
                padding: '10px 20px', 
                fontSize: '16px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Login
            </a>
            <a 
              href={`/signup?redirect=${encodeURIComponent(`/invitations/accept?token=${token}`)}`}
              style={{ 
                padding: '10px 20px', 
                fontSize: '16px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block'
              }}
            >
              Sign Up
            </a>
          </div>
        </div>
      ) : user.email !== invitation.email ? (
        <div>
          <p style={{ color: 'orange' }}>
            You are currently logged in as <strong>{user.email}</strong>, 
            but this invitation was sent to <strong>{invitation.email}</strong>.
          </p>
          <p>
            Please <a href="/logout">logout</a> and login with the invited email address.
          </p>
        </div>
      ) : (
        <form method="post">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            style={{ 
              width: '100%',
              padding: '12px', 
              fontSize: '18px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Accept Invitation
          </button>
        </form>
      )}
    </div>
  );
}
