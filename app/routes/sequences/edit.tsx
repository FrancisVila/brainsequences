import { redirect } from 'react-router';
import type { Route } from './+types/edit';
import SequenceViewer from '~/components/SequenceViewer';
import { requireAuth } from '~/server/auth';
import { canEditSequence } from '~/server/db-drizzle';

export async function loader({ request, params }: Route.LoaderArgs) {
  // Get sequence ID from URL params
  const sequenceId = params.id;
  
  if (!sequenceId) {
    throw redirect('/');
  }
  
  // Require authentication
  const user = await requireAuth(request);
  
  // Check if user can edit this sequence
  const canEdit = await canEditSequence(Number(sequenceId), user.id);
  if (!canEdit && user.role !== 'admin') {
    throw new Response('Forbidden - you do not have permission to edit this sequence', { status: 403 });
  }
  
  return { user };
}

export default function SequenceEdit({ loaderData }: Route.ComponentProps) {
  return <SequenceViewer editMode={true} />;
}
