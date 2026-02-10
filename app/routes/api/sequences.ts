// GET /api/sequences - return list of sequences or a specific sequence by id
export async function loader({ request }) {
  // Import server modules dynamically inside loader
  const { getAllSequences, getSequence, canEditSequence, getPublishedSequences } = await import('../../server/db-drizzle.server');
  const { getCurrentUser } = await import('../../server/auth.server');
  
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
  // Import server modules dynamically inside action
  const { createSequence, updateSequence, canEditSequence, getSequence } = await import('../../server/db-drizzle.server');
  const { requireAuth } = await import('../../server/auth.server');
  const { db } = await import('../../server/drizzle.server');
  const { sequences, steps } = await import('../../../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
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

  if (method === 'PATCH') {
    // PATCH /api/sequences?id=X&action=publish - publish a draft sequence
    const user = await requireAuth(request);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Sequence ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'publish') {
      const sequenceId = Number(id);

      // Check if user can edit this sequence
      const canEdit = await canEditSequence(sequenceId, user.id);
      if (!canEdit && user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to publish this sequence' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Get the draft sequence
        const [draftSequence] = await db.select().from(sequences).where(eq(sequences.id, sequenceId)).limit(1);
        
        if (!draftSequence) {
          return new Response(JSON.stringify({ error: 'Sequence not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        if (draftSequence.draft === 0) {
          return new Response(JSON.stringify({ error: 'Sequence is already published' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        let publishedId = sequenceId;

        // If this is editing an existing published sequence (has publishedVersionId)
        if (draftSequence.publishedVersionId) {
          const publishedVersionId = draftSequence.publishedVersionId;
          
          // Get all draft steps with their relations
          const draftSteps = await db.select().from(steps).where(eq(steps.sequenceId, sequenceId));
          
          // Delete old published steps and relations (cascade should handle relations)
          await db.delete(steps).where(eq(steps.sequenceId, publishedVersionId));
          
          // Copy draft steps to published sequence
          for (const draftStep of draftSteps) {
            const [newStep] = await db.insert(steps).values({
              sequenceId: publishedVersionId,
              title: draftStep.title,
              description: draftStep.description,
              draft: 0, // Mark as published
            }).returning({ id: steps.id });
            
            // Copy step_brainparts
            const { stepBrainparts } = await import('../../../drizzle/schema.js');
            const brainpartLinks = await db.select().from(stepBrainparts).where(eq(stepBrainparts.stepId, draftStep.id));
            if (brainpartLinks.length > 0) {
              await db.insert(stepBrainparts).values(
                brainpartLinks.map(link => ({
                  stepId: newStep.id,
                  brainpartId: link.brainpartId,
                }))
              );
            }
            
            // Copy step_links
            const { stepLinks } = await import('../../../drizzle/schema.js');
            const links = await db.select().from(stepLinks).where(eq(stepLinks.stepId, draftStep.id));
            if (links.length > 0) {
              await db.insert(stepLinks).values(
                links.map(link => ({
                  stepId: newStep.id,
                  x1: link.x1,
                  y1: link.y1,
                  x2: link.x2,
                  y2: link.y2,
                  curvature: link.curvature,
                  strokeWidth: link.strokeWidth,
                }))
              );
            }
          }
          
          // Update the published sequence metadata
          await db.update(sequences)
            .set({
              title: draftSequence.title,
              description: draftSequence.description,
              currentlyEditedBy: null,
              lastEditedAt: Date.now(),
            })
            .where(eq(sequences.id, publishedVersionId));
          
          // Delete the draft sequence (cascade will delete its steps and relations)
          await db.delete(sequences).where(eq(sequences.id, sequenceId));
          
          publishedId = publishedVersionId;
        } else {
          // This is a new sequence being published for the first time
          await db.update(sequences)
            .set({
              draft: 0,
              isPublishedVersion: 1,
              publishedVersionId: null,
              currentlyEditedBy: null,
            })
            .where(eq(sequences.id, sequenceId));

          // Update all steps to be published
          await db.update(steps)
            .set({ draft: 0 })
            .where(eq(steps.sequenceId, sequenceId));
        }

        return new Response(JSON.stringify({ 
          success: true,
          id: publishedId,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Failed to publish sequence:', error);
        return new Response(JSON.stringify({ error: 'Failed to publish sequence' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'unpublish') {
      const sequenceId = Number(id);

      // Check if user can edit this sequence
      const canEdit = await canEditSequence(sequenceId, user.id);
      if (!canEdit && user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden - you do not have permission to unpublish this sequence' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      try {
        // Get the sequence
        const [sequence] = await db.select().from(sequences).where(eq(sequences.id, sequenceId)).limit(1);
        
        if (!sequence) {
          return new Response(JSON.stringify({ error: 'Sequence not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        let draftId = sequenceId;
        let publishedId = sequence.publishedVersionId;

        // Check if this is a draft with a published version
        if (sequence.draft === 1 && sequence.publishedVersionId) {
          // Already have the draft ID
          publishedId = sequence.publishedVersionId;
        } 
        // Check if this is a published sequence
        else if (sequence.draft === 0 && sequence.isPublishedVersion === 1) {
          // Find the draft that references this published version
          const [draft] = await db.select().from(sequences).where(eq(sequences.publishedVersionId, sequenceId)).limit(1);
          
          if (draft) {
            draftId = draft.id;
            publishedId = sequenceId;
          } else {
            // No draft exists, so just convert the published sequence to a draft
            await db.update(sequences)
              .set({
                draft: 1,
                isPublishedVersion: 0,
                currentlyEditedBy: null,
              })
              .where(eq(sequences.id, sequenceId));
            
            // Update all steps to be drafts
            await db.update(steps)
              .set({ draft: 1 })
              .where(eq(steps.sequenceId, sequenceId));
            
            return new Response(JSON.stringify({ 
              success: true,
              id: sequenceId,
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        } else {
          return new Response(JSON.stringify({ error: 'Cannot unpublish: not a published sequence' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Delete the published version (cascade will handle steps and relations)
        await db.delete(sequences).where(eq(sequences.id, publishedId));
        
        // Update the draft to remove the published version reference
        await db.update(sequences)
          .set({
            publishedVersionId: null,
            currentlyEditedBy: null,
          })
          .where(eq(sequences.id, draftId));
        
        return new Response(JSON.stringify({ 
          success: true,
          id: draftId,
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });

      } catch (error) {
        console.error('Failed to unpublish sequence:', error);
        return new Response(JSON.stringify({ error: 'Failed to unpublish sequence' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }
  
  if (method === 'DELETE') {
    // Require authentication to delete sequences
    const user = await requireAuth(request);
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const sequenceId = Number(id);
    
    // Check permission
    const canEdit = await canEditSequence(sequenceId, user.id);
    if (!canEdit && user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // If action is delete-draft, only delete drafts
    if (action === 'delete-draft') {
      const sequence = await getSequence(sequenceId);
      if (sequence && sequence.draft === 1) {
        await db.delete(sequences).where(eq(sequences.id, sequenceId));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ error: 'Not a draft sequence' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}
