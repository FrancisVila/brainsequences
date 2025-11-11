import { getAllSequences, getSequence } from '../../server/db-drizzle.js';

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
