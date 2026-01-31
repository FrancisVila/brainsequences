import type { Route } from './+types/sequence';
import SequenceViewer from '~/components/SequenceViewer';

export async function loader({ request, params }: Route.LoaderArgs) {
  // Dynamic imports to ensure server code stays on server
  const { getCurrentUser } = await import('~/server/auth.server');
  const { canEditSequence, getSequence } = await import('~/server/db-drizzle.server');
  
  const sequenceId = params.id;
  
  if (!sequenceId) {
    return { user: null, canEdit: false, sequence: null };
  }
  
  const user = await getCurrentUser(request);
  const sequence = await getSequence(Number(sequenceId));
  
  // Check if user can edit (for showing edit button)
  let canEdit = false;
  if (user && sequence) {
    // Published sequences can be viewed by anyone, but only owners/collaborators can edit
    canEdit = await canEditSequence(Number(sequenceId), user.id) || user.role === 'admin';
  }
  
  return { user, canEdit, sequence };
}

export default function Sequence({ loaderData }: Route.ComponentProps) {
  const { user, canEdit, sequence } = loaderData;
  
  return (
    <>
      {canEdit && sequence && (
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#e7f3ff',
          borderBottom: '1px solid #b3d9ff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>You have edit access to this sequence</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href={`/sequences/${sequence.id}/edit`}
              style={{
                padding: '6px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              Edit Sequence
            </a>
            <a 
              href={`/sequences/${sequence.id}/collaborators`}
              style={{
                padding: '6px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              Manage Collaborators
            </a>
          </div>
        </div>
      )}
      <SequenceViewer editMode={false} />
    </>
  );
}
