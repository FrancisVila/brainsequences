import type { Route } from './+types/sequence';
import SequenceViewer from '~/components/SequenceViewer';

export async function loader({ request, params }: Route.LoaderArgs) {
  // Dynamic imports to ensure server code stays on server
  const { getCurrentUser } = await import('~/server/auth.server');
  const { canEditSequence, getSequence } = await import('~/server/db-drizzle.server');
  const { db } = await import('~/server/drizzle.server');
  const { sequences } = await import('../../drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  const sequenceId = params.id;
  
  if (!sequenceId) {
    return { user: null, canEdit: false, isCreator: false, sequence: null, hasDraft: false, publishedVersionId: null };
  }
  
  const user = await getCurrentUser(request);
  const sequence = await getSequence(Number(sequenceId));
  
  if (!sequence) {
    return { user, canEdit: false, isCreator: false, sequence: null, hasDraft: false, publishedVersionId: null };
  }
  
  // Check if this is a draft and block non-logged-in users
  if (sequence.draft === 1 && !user) {
    return { user: null, canEdit: false, isCreator: false, sequence: null, hasDraft: false, publishedVersionId: null };
  }
  
  // If draft, check if user has permission to view it
  if (sequence.draft === 1 && user) {
    const canView = await canEditSequence(Number(sequenceId), user.id) || user.role === 'admin';
    if (!canView) {
      return { user, canEdit: false, isCreator: false, sequence: null, hasDraft: false, publishedVersionId: null };
    }
  }
  
  // Check if user can edit (for showing edit button)
  let canEdit = false;
  let isCreator = false;
  if (user && sequence) {
    // Published sequences can be viewed by anyone, but only owners/collaborators can edit
    canEdit = await canEditSequence(Number(sequenceId), user.id) || user.role === 'admin';
    isCreator = sequence.userId === user.id;
  }
  
  // Check if there's a draft version for this published sequence
  let hasDraft = false;
  if (sequence.isPublishedVersion === 1) {
    const [draftVersion] = await db.select()
      .from(sequences)
      .where(and(
        eq(sequences.publishedVersionId, Number(sequenceId)),
        eq(sequences.draft, 1)
      ))
      .limit(1);
    hasDraft = !!draftVersion;
  }
  
  return { 
    user, 
    canEdit, 
    isCreator,
    sequence,
    hasDraft,
    publishedVersionId: sequence.publishedVersionId
  };
}

export default function Sequence({ loaderData }: Route.ComponentProps) {
  const { user, canEdit, isCreator, sequence, hasDraft, publishedVersionId } = loaderData;
  
  if (!sequence) {
    return <div>Sequence not found</div>;
  }
  
  // Determine if we're viewing a draft
  const isDraft = sequence.draft === 1;
  const isPublished = sequence.isPublishedVersion === 1;
  
  return (
    <SequenceViewer 
      editMode={false} 
      canEdit={canEdit}
      isCreator={isCreator}
      isDraft={isDraft}
      isPublished={isPublished}
      hasDraft={hasDraft}
      publishedVersionId={publishedVersionId}
    />
  );
}
