import { getCurrentUser, requireAuth } from '../../../server/auth';
import { db } from '../../../server/drizzle';
import { sequences, steps } from '../../../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { canEditSequence } from '../../../server/db-drizzle';

// POST /api/sequences/publish - publish a draft sequence
export async function action({ request }) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await requireAuth(request);
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Sequence ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sequenceId = Number(id);

  // Check if user can edit this sequence
  const canEdit = await canEditSequence(sequenceId, user.id);
  if (!canEdit && user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to publish this sequence' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get the draft sequence
    const [sequence] = await db.select().from(sequences).where(eq(sequences.id, sequenceId)).limit(1);
    
    if (!sequence) {
      return new Response(JSON.stringify({ error: 'Sequence not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (sequence.draft === 0) {
      return new Response(JSON.stringify({ error: 'Sequence is already published' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Start transaction to publish
    // If this is editing an existing published sequence (has publishedVersionId)
    if (sequence.publishedVersionId) {
      // Delete the old published version (cascade will delete its steps)
      await db.delete(sequences).where(eq(sequences.id, sequence.publishedVersionId));
    }

    // Update this sequence to be published
    await db.update(sequences)
      .set({
        draft: 0,
        isPublishedVersion: 1,
        publishedVersionId: null,
        currentlyEditedBy: null,
      })
      .where(eq(sequences.id, sequenceId));

    // Update all steps to be published
    await db.update(steps)
      .set({ draft: 0 })
      .where(eq(steps.sequenceId, sequenceId));

    return new Response(JSON.stringify({ 
      success: true,
      id: sequenceId,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Failed to publish sequence:', error);
    return new Response(JSON.stringify({ error: 'Failed to publish sequence' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
