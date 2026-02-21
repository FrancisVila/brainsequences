// GET /api/user/citation-preference - get user's citation visibility preference
// PUT /api/user/citation-preference - update user's citation visibility preference
export async function action({ request }) {
  const { updateUserCitationPreference, getUserCitationPreference } = await import('../../../server/db-drizzle.server');
  const { requireAuth } = await import('../../../server/auth.server');
  
  const method = request.method;
  
  // Require authentication
  const user = await requireAuth(request);
  
  if (method === 'PUT') {
    const body = await request.json();
    const { showCitations } = body;
    
    if (showCitations === undefined) {
      return new Response(JSON.stringify({ error: 'showCitations is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await updateUserCitationPreference(user.id, Boolean(showCitations));
    
    return new Response(JSON.stringify({ success: true, showCitations: Boolean(showCitations) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET request to fetch user's citation preference
export async function loader({ request }) {
  const { getUserCitationPreference } = await import('../../../server/db-drizzle.server');
  const { getAuthFromRequest } = await import('../../../server/auth.server');
  
  // Don't require auth for GET - return default if not logged in
  const user = await getAuthFromRequest(request);
  
  if (!user) {
    return new Response(JSON.stringify({ showCitations: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const showCitations = await getUserCitationPreference(user.id);
  
  return new Response(JSON.stringify({ showCitations }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
