import { redirect, data } from 'react-router';
import type { Route } from './+types/$id.collaborators';
import { 
  requireAuth, 
  getCurrentUser 
} from '../../server/auth';
import { 
  getSequence,
  isSequenceOwner, 
  getSequenceCollaborators, 
  removeCollaborator,
  createInvitation,
  getSequenceInvitations,
  deleteInvitation,
  findUserByEmail
} from '../../server/db-drizzle';
import { sendInvitationEmail } from '../../server/email';
import crypto from 'crypto';

export async function loader({ request, params }: Route.LoaderArgs) {
  const user = await requireAuth(request);
  const sequenceId = Number(params.id);
  
  // Only owner can manage collaborators
  const isOwner = await isSequenceOwner(sequenceId, user.id);
  if (!isOwner && user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  
  const sequence = await getSequence(sequenceId);
  if (!sequence) {
    throw new Response('Not Found', { status: 404 });
  }
  
  const collaborators = await getSequenceCollaborators(sequenceId);
  const invitations = await getSequenceInvitations(sequenceId);
  
  return {
    sequence,
    collaborators,
    invitations,
    currentUserId: user.id,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAuth(request);
  const sequenceId = Number(params.id);
  
  // Only owner can manage collaborators
  const isOwner = await isSequenceOwner(sequenceId, user.id);
  if (!isOwner && user.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  
  const formData = await request.formData();
  const action = formData.get('_action');
  
  if (action === 'invite') {
    const email = formData.get('email') as string;
    
    if (!email) {
      return data({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check if user with this email exists
    const invitedUser = await findUserByEmail(email);
    
    // Check if they're already a collaborator
    if (invitedUser) {
      const collaborators = await getSequenceCollaborators(sequenceId);
      if (collaborators.some(c => c.userId === invitedUser.id)) {
        return data({ error: 'This user is already a collaborator' }, { status: 400 });
      }
    }
    
    // Check if there's already a pending invitation for this email
    const existingInvitations = await getSequenceInvitations(sequenceId);
    const pendingInvite = existingInvitations.find(
      inv => inv.email === email && !inv.acceptedAt && inv.expiresAt > Date.now()
    );
    
    if (pendingInvite) {
      return data({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }
    
    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    
    await createInvitation({
      token,
      sequenceId,
      email,
      invitedBy: user.id,
      expiresAt,
    });
    
    // Send invitation email
    const sequence = await getSequence(sequenceId);
    try {
      await sendInvitationEmail(email, user.email, sequence!.title, token);
      return data({ success: 'Invitation sent successfully' });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      return data({ error: 'Failed to send invitation email. Please check email configuration.' }, { status: 500 });
    }
  }
  
  if (action === 'remove') {
    const userId = Number(formData.get('userId'));
    await removeCollaborator(sequenceId, userId);
    return data({ success: 'Collaborator removed' });
  }
  
  if (action === 'deleteInvitation') {
    const invitationId = Number(formData.get('invitationId'));
    await deleteInvitation(invitationId);
    return data({ success: 'Invitation deleted' });
  }
  
  return data({ error: 'Invalid action' }, { status: 400 });
}

export default function SequenceCollaborators({ loaderData, actionData }: Route.ComponentProps) {
  const { sequence, collaborators, invitations, currentUserId } = loaderData;
  
  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <h1>Manage Collaborators for "{sequence.title}"</h1>
      
      <p>
        <a href={`/sequences/${sequence.id}`}>← Back to Sequence</a>
      </p>
      
      {actionData?.success && (
        <div style={{ 
          color: 'green', 
          padding: '10px', 
          marginBottom: '20px',
          border: '1px solid green',
          borderRadius: '4px'
        }}>
          {actionData.success}
        </div>
      )}
      
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
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Invite New Collaborator</h2>
        <form method="post">
          <input type="hidden" name="_action" value="invite" />
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              required
              style={{ 
                flex: 1,
                padding: '8px', 
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <button
              type="submit"
              style={{ 
                padding: '8px 20px', 
                fontSize: '16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Send Invitation
            </button>
          </div>
          <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
            Invitation will expire in 7 days
          </small>
        </form>
      </section>
      
      <section style={{ marginBottom: '30px' }}>
        <h2>Current Collaborators ({collaborators.length})</h2>
        {collaborators.length === 0 ? (
          <p style={{ color: '#666' }}>No collaborators yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Permission</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Added</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaborators.map((collab) => (
                <tr key={collab.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{collab.email}</td>
                  <td style={{ padding: '10px' }}>{collab.permissionLevel}</td>
                  <td style={{ padding: '10px' }}>
                    {new Date(Number(collab.createdAt)).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right', padding: '10px' }}>
                    <form method="post" style={{ display: 'inline' }}>
                      <input type="hidden" name="_action" value="remove" />
                      <input type="hidden" name="userId" value={collab.userId} />
                      <button
                        type="submit"
                        style={{ 
                          padding: '4px 12px',
                          fontSize: '14px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          if (!confirm('Remove this collaborator?')) {
                            e.preventDefault();
                          }
                        }}
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      
      <section>
        <h2>Pending Invitations ({invitations.filter(i => !i.acceptedAt).length})</h2>
        {invitations.filter(i => !i.acceptedAt).length === 0 ? (
          <p style={{ color: '#666' }}>No pending invitations.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '10px' }}>Email</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Invited By</th>
                <th style={{ textAlign: 'left', padding: '10px' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '10px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invitations
                .filter(i => !i.acceptedAt)
                .map((inv) => {
                  const isExpired = inv.expiresAt < Date.now();
                  return (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{inv.email}</td>
                      <td style={{ padding: '10px' }}>{inv.inviterEmail}</td>
                      <td style={{ padding: '10px' }}>
                        {isExpired ? (
                          <span style={{ color: 'red' }}>Expired</span>
                        ) : (
                          <span style={{ color: 'orange' }}>Pending</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px' }}>
                        <form method="post" style={{ display: 'inline' }}>
                          <input type="hidden" name="_action" value="deleteInvitation" />
                          <input type="hidden" name="invitationId" value={inv.id} />
                          <button
                            type="submit"
                            style={{ 
                              padding: '4px 12px',
                              fontSize: '14px',
                              backgroundColor: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
