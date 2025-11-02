import { getNotes, createNote } from '../../server/db-drizzle.js';

// Return latest notes
export async function loader() {
  const rows = await getNotes(100);
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Insert a new note
export async function action({ request }) {
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body.content !== 'string') {
    return new Response(JSON.stringify({ error: 'content required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const result = await createNote(body.content);
  return new Response(JSON.stringify({ id: result.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}