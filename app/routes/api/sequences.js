import { getAllSequences, getSequence, createSequence, updateSequence, canEditSequence, getPublishedSequences } from '../../server/db-drizzle.js';
import { getCurrentUser, requireAuth } from '../../server/auth';
import { db } from '../../server/drizzle';
import { sequences } from '../../../drizzle/schema';

// GET /api/sequences - return list of sequences or a specific sequence by id
export async function loader({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const user = await getCurrentUser(request);
  
  if (id) {
    const sequence = await getSequence(Number(id));
    if (!sequence) {
      return new Response(JSON.stringify(null), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if user can view this sequence
    // Published sequences can be viewed by anyone
    // Draft sequences can only be viewed by owner or collaborators
    if (sequence.draft) {
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      const canEdit = await canEditSequence(Number(id), user.id);
      if (!canEdit && user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify(sequence), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Return all published sequences for unauthenticated users
  // Return all sequences for authenticated users (they can see their own drafts)
  let allSequences;
  if (user) {
    allSequences = await getAllSequences();
  } else {
    allSequences = await getPublishedSequences();
  }
  
  return new Response(JSON.stringify(allSequences), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/sequences - create a new sequence
export async function action({ request }) {
  const method = request.method;
  
  if (method === 'POST') {
    // Require authentication to create sequences
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { title, description } = body;
    
    if (!title || !title.trim()) {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Create sequence with owner
    const result = await db.insert(sequences).values({
      title: title.trim(),
      description,
      userId: user.id,
      draft: 1, // Default to draft
    }).returning({ id: sequences.id });
    
    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (method === 'PUT') {
    // Require authentication to update sequences
    const user = await requireAuth(request);
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user can edit this sequence
    const canEdit = await canEditSequence(Number(id), user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this sequence' }), {
        status: 403,
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
