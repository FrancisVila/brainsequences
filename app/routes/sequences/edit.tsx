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
  const { canEditSequence, createDraftFromPublished, getSequence } = await import('~/server/db-drizzle.server');
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
  
  // Get full sequence data for navbar
  const fullSequence = await getSequence(Number(sequenceId));
  const isCreator = fullSequence?.userId === user.id;
  
  return { 
    user,
    sequence: fullSequence,
    isCreator
  };
}

export default function SequenceEdit({ loaderData }: Route.ComponentProps) {
  const { user, sequence, isCreator } = loaderData;
  
  if (!sequence) {
    return <div>Sequence not found</div>;
  }
  
  // Determine if we're editing a draft
  const isDraft = sequence.draft === 1;
  const publishedVersionId = sequence.publishedVersionId;
  
  return (
    <SequenceViewer 
      editMode={true}
      canEdit={true}
      isCreator={isCreator}
      isDraft={isDraft}
      isPublished={false}
      hasDraft={false}
      publishedVersionId={publishedVersionId}
    />
  );
}
