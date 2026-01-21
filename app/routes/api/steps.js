import { createStep, updateStep, deleteStep, updateStepLinks } from '../../server/db-drizzle.js';

// POST /api/steps - create a new step
// PUT /api/steps?id=X - update an existing step
// DELETE /api/steps?id=X - delete a step
export async function action({ request }) {
  const method = request.method;
  const url = new URL(request.url);
  
  if (method === 'POST') {
    const body = await request.json();
    const { sequenceId, title, description, brainpartIds } = body;
    
    if (!sequenceId || !title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Sequence ID and title are required' }), {
        status: 400,
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
