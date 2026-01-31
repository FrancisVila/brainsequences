import { createStep, updateStep, deleteStep, updateStepLinks, canEditSequence } from '../../server/db-drizzle.server.js';
import { requireAuth } from '../../server/auth.server.js';
import { db } from '../../server/drizzle.server.js';
import { steps } from '../../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Helper to get sequence ID from step ID
async function getSequenceIdFromStep(stepId) {
  const [step] = await db.select({ sequenceId: steps.sequenceId })
    .from(steps)
    .where(eq(steps.id, stepId))
    .limit(1);
  return step?.sequenceId || null;
}

// POST /api/steps - create a new step
// PUT /api/steps?id=X - update an existing step
// DELETE /api/steps?id=X - delete a step
export async function action({ request }) {
  const method = request.method;
  const url = new URL(request.url);
  
  // Require authentication for all step operations
  const user = await requireAuth(request);
  
  if (method === 'POST') {
    const body = await request.json();
    const { sequenceId, title, description, brainpartIds } = body;
    
    if (!sequenceId || !title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Sequence ID and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user can edit the sequence
    const canEdit = await canEditSequence(Number(sequenceId), user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this sequence' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const result = await createStep({ 
      sequenceId: Number(sequenceId), 
      title: title.trim(), 
      description,
      brainpartIds: brainpartIds || []
    });
    
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (method === 'PUT') {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get sequence ID from step and check permissions
    const sequenceId = await getSequenceIdFromStep(Number(id));
    if (!sequenceId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this sequence' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const body = await request.json();
    const { title, description, brainpartIds, stepLinks } = body;
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const result = await updateStep(Number(id), { 
      title: title.trim(), 
      description,
      brainpartIds: brainpartIds || []
    });
    
    // Update step links if provided
    if (stepLinks !== undefined) {
      await updateStepLinks(Number(id), stepLinks);
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get sequence ID from step and check permissions
    const sequenceId = await getSequenceIdFromStep(Number(id));
    if (!sequenceId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this sequence' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await deleteStep(Number(id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
