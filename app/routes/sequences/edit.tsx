import { redirect } from 'react-router';
import type { Route } from './+types/edit';
import SequenceViewer from '~/components/SequenceViewer';
import { requireAuth } from '~/server/auth.server';

export async function loader({ request, params }: Route.LoaderArgs) {
  // Get sequence ID from URL params
  const sequenceId = params.id;
  
  if (!sequenceId) {
    throw redirect('/');
  }
  
  // Require authentication
  const user = await requireAuth(request);
  
  // Import server-only modules inside the loader to avoid client bundling
  const { canEditSequence, createDraftFromPublished } = await import('~/server/db-drizzle.server');
  const { db } = await import('~/server/drizzle.server');
  const { sequences } = await import('../../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  // Check if user can edit this sequence
  const canEdit = await canEditSequence(Number(sequenceId), user.id);
  if (!canEdit && user.role !== 'admin') {
    throw new Response('Forbidden - you do not have permission to edit this sequence', { status: 403 });
  }
  
  // Check if this is a published sequence
  const [sequence] = await db.select().from(sequences).where(eq(sequences.id, Number(sequenceId))).limit(1);
  
  if (!sequence) {
    throw new Response('Sequence not found', { status: 404 });
  }
  
  // If it's a published sequence, create or redirect to draft version
  if (sequence.draft === 0 && sequence.isPublishedVersion === 1) {
    const draftResult = await createDraftFromPublished(Number(sequenceId), user.id);
    // Redirect to the draft version for editing
    throw redirect(`/sequences/${draftResult.id}/edit`);
  }
  
  return { user };
}

export default function SequenceEdit({ loaderData }: Route.ComponentProps) {
  return <SequenceViewer editMode={true} />;
}
