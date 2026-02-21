// Helper to get sequence ID from step ID
async function getSequenceIdFromStep(stepId: number) {
  const { db } = await import('../../server/drizzle.server');
  const { steps } = await import('../../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const [step] = await db.select({ sequenceId: steps.sequenceId })
    .from(steps)
    .where(eq(steps.id, stepId))
    .limit(1);
  return step?.sequenceId || null;
}

// GET /api/citations?stepId=X - get all citations for a step
// POST /api/citations - create a new citation
// PUT /api/citations?id=X - update an existing citation
// DELETE /api/citations?id=X - delete a citation
export async function action({ request }) {
  const { createCitation, getStepCitations, updateCitation, deleteCitation, canEditSequence } = await import('../../server/db-drizzle.server');
  const { requireAuth } = await import('../../server/auth.server');
  const { db } = await import('../../server/drizzle.server');
  const { citations } = await import('../../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const method = request.method;
  const url = new URL(request.url);
  
  // Require authentication for all citation operations
  const user = await requireAuth(request);
  
  if (method === 'POST') {
    const body = await request.json();
    const { stepId, title, url: citationUrl, orderIndex } = body;
    
    if (!stepId || !title || !title.trim() || !citationUrl || !citationUrl.trim()) {
      return new Response(JSON.stringify({ error: 'Step ID, title, and URL are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user can edit the sequence that contains this step
    const sequenceId = await getSequenceIdFromStep(Number(stepId));
    if (!sequenceId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this sequence' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const result = await createCitation({ 
      stepId: Number(stepId), 
      title: title.trim(), 
      url: citationUrl.trim(),
      orderIndex: orderIndex || 0
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
    
    // Get the citation to find its step
    const [citation] = await db.select().from(citations).where(eq(citations.id, Number(id))).limit(1);
    if (!citation) {
      return new Response(JSON.stringify({ error: 'Citation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check permissions
    const sequenceId = await getSequenceIdFromStep(citation.stepId);
    if (!sequenceId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to edit this citation' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const body = await request.json();
    const { title, url: citationUrl, orderIndex } = body;
    
    const result = await updateCitation(Number(id), { 
      title: title?.trim(), 
      url: citationUrl?.trim(),
      orderIndex
    });
    
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
    
    // Get the citation to find its step
    const [citation] = await db.select().from(citations).where(eq(citations.id, Number(id))).limit(1);
    if (!citation) {
      return new Response(JSON.stringify({ error: 'Citation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check permissions
    const sequenceId = await getSequenceIdFromStep(citation.stepId);
    if (!sequenceId) {
      return new Response(JSON.stringify({ error: 'Step not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to delete this citation' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await deleteCitation(Number(id));
    
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

// GET request to fetch citations for a step
export async function loader({ request }) {
  const { getStepCitations } = await import('../../server/db-drizzle.server');
  
  const url = new URL(request.url);
  const stepId = url.searchParams.get('stepId');
  
  if (!stepId) {
    return new Response(JSON.stringify({ error: 'Step ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  const citationsList = await getStepCitations(Number(stepId));
  
  return new Response(JSON.stringify(citationsList), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
