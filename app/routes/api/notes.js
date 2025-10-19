import { all, run } from '../../server/db.js';

// Return latest notes
// activated by fetch('/api/notes')  .then(r => r.json()) ...
export async function loader() {
  const rows = all('SELECT id, content, created_at FROM notes ORDER BY id DESC LIMIT 100');
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Insert a new note
// activated by await fetch('/api/notes', { method: 'POST' ...
export async function action({ request }) {
  // POST /api/notes - insert a new note
  const body = await request.json();
  if (!body || typeof body.content !== 'string') {
    return new Response(JSON.stringify({ error: 'content required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const info = run('INSERT INTO notes (content) VALUES (?)', [body.content]);
  return new Response(JSON.stringify({ id: info.lastInsertRowid }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
