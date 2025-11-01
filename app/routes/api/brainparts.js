import { all, get, run } from '../../server/db.js';

// GET /api/brainparts - return list of brainparts
export async function loader({ request }) {
  // allow optional query ?id= to return single item
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const row = get('SELECT * FROM brainparts WHERE id = ?', [id]);
    return new Response(JSON.stringify(row || null), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rows = all('SELECT * FROM brainparts ORDER BY id DESC LIMIT 1000');
  return new Response(JSON.stringify(rows), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// POST /api/brainparts - create
// PUT /api/brainparts - update (requires id in body)
// DELETE /api/brainparts - delete (requires id in body)
export async function action({ request }) {
  const method = request.method.toUpperCase();
  const body = await request.json().catch(() => ({}));

  if (method === 'POST') {
    // Validate title: must be a non-empty string after trimming
    if (!body || typeof body.title !== 'string' || body.title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'title required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    const info = run(
      'INSERT INTO brainparts (title, description, is_part_of) VALUES (?, ?, ?)',
      [body.title, body.description || null, body.is_part_of || null]
    );
    return new Response(JSON.stringify({ id: info.lastInsertRowid }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  if (method === 'PUT') {
    if (!body || typeof body.id === 'undefined') {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    // Validate title when provided: must be non-empty string after trimming
    if (typeof body.title !== 'string' || body.title.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'title required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    try {
      run(
        'UPDATE brainparts SET title = ?, description = ?, is_part_of = ? WHERE id = ?',
        [body.title, body.description ?? null, body.is_part_of ?? null, body.id]
      );
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
      console.error('Error updating brainpart:', err);
      return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  if (method === 'DELETE') {
    if (!body || typeof body.id === 'undefined') {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    run('DELETE FROM brainparts WHERE id = ?', [body.id]);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: 'unsupported method' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
}
