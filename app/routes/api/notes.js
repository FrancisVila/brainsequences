import { json } from '@react-router/node';
import { all, run } from '../../server/db.js';

export async function loader() {
  // GET /api/notes - return latest notes
  const rows = all('SELECT id, content, created_at FROM notes ORDER BY id DESC LIMIT 100');
  return json(rows);
}

export async function action({ request }) {
  // POST /api/notes - insert a new note
  const body = await request.json();
  if (!body || typeof body.content !== 'string') {
    return json({ error: 'content required' }, { status: 400 });
  }
  const info = run('INSERT INTO notes (content) VALUES (?)', [body.content]);
  return json({ id: info.lastInsertRowid });
}
