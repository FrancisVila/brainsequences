import { 
  getAllBrainparts, getBrainpart, createBrainpart, updateBrainpart, deleteBrainpart 
} from '../../server/db-drizzle.server.js';
import { requireRole } from '../../server/auth.server.js';

// GET /api/brainparts - return list of brainparts
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const brainpart = await getBrainpart(Number(id));
      return new Response(JSON.stringify(brainpart || null), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const parts = await getAllBrainparts();
    return new Response(JSON.stringify(parts), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in brainparts loader:', error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST /api/brainparts - create
// PUT /api/brainparts - update (requires id)
// DELETE /api/brainparts - delete (requires id)
export async function action({ request }) {
  // Require admin role for all brainpart modifications
  await requireRole(request, 'admin');
  
  const method = request.method.toUpperCase();
  const body = await request.json().catch(() => ({}));

  if (method === 'POST') {
    // Validate title: must be a non-empty string after trimming
    if (!body || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'title required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const result = await createBrainpart({
      title: body.title,
      description: body.description || null,
      isPartOf: body.is_part_of || null
    });
    
    return new Response(JSON.stringify({ id: result.id }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  if (method === 'PUT') {
    if (!body || typeof body.id === 'undefined') {
      return new Response(JSON.stringify({ error: 'id required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    // Validate title when provided: must be non-empty string after trimming
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'title required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    try {
      await updateBrainpart(body.id, {
        title: body.title,
        description: body.description ?? null,
        isPartOf: body.is_part_of ?? null
      });
      
      return new Response(JSON.stringify({ ok: true }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      });
    } catch (err) {
      console.error('Error updating brainpart:', err);
      return new Response(JSON.stringify({ error: String(err) }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  if (method === 'DELETE') {
    if (!body || typeof body.id === 'undefined') {
      return new Response(JSON.stringify({ error: 'id required' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    await deleteBrainpart(body.id);
    return new Response(JSON.stringify({ ok: true }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  return new Response(JSON.stringify({ error: 'unsupported method' }), { 
    status: 405, 
    headers: { 'Content-Type': 'application/json' } 
  });
}