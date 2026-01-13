import { getAllSequences, getSequence, createSequence, updateSequence } from '../../server/db-drizzle.js';

// GET /api/sequences - return list of sequences or a specific sequence by id
export async function loader({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (id) {
    const sequence = await getSequence(Number(id));
    return new Response(JSON.stringify(sequence || null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const allSequences = await getAllSequences();
  return new Response(JSON.stringify(allSequences), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/sequences - create a new sequence
export async function action({ request }) {
  const method = request.method;
  
  if (method === 'POST') {
    const body = await request.json();
    const { title, description } = body;
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const result = await createSequence({ title: title.trim(), description });
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (method === 'PUT') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const body = await request.json();
    const { title, description } = body;
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const result = await updateSequence(Number(id), { title: title.trim(), description });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
