import { eq, and, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import { sequences, steps, brainparts, brainpartLinks, stepBrainparts, arrows, stepLinks, users, sequenceCollaborators, invitations, passwordResets } from '../../drizzle/schema';


// Sequences operations
export async function getSequence(id: number) {
  const [sequence] = await db.select().from(sequences).where(eq(sequences.id, id)).limit(1);
  if (!sequence) return null;

  // Get steps for this sequence with their brainparts
  const sequenceSteps = await db
    .select({
      step: steps,
      brainpartIds: stepBrainparts.brainpartId,
      brainpartTitles: brainparts.title,
      brainpartImages: brainparts.image,
    })
    .from(steps)
    .leftJoin(stepBrainparts, eq(steps.id, stepBrainparts.stepId))
    .leftJoin(brainparts, eq(stepBrainparts.brainpartId, brainparts.id))
    .where(eq(steps.sequenceId, id));

  // Group brainparts by step
  const stepsWithParts = sequenceSteps.reduce((acc, { step, brainpartIds, brainpartTitles, brainpartImages }) => {
    const existingStep = acc.find(s => s.id === step.id);
    if (existingStep) {
      if (brainpartIds) {
        existingStep.brainpart_ids = (existingStep.brainpart_ids || []).concat(brainpartIds);
        existingStep.brainpart_titles = (existingStep.brainpart_titles || []).concat(brainpartTitles || '');
        existingStep.brainpart_images = (existingStep.brainpart_images || []).concat(brainpartImages || '');
      }
    } else {
      acc.push({
        ...step,
        brainpart_ids: brainpartIds ? [brainpartIds] : [],
        brainpart_titles: brainpartTitles ? [brainpartTitles] : [],
        brainpart_images: brainpartImages ? [brainpartImages] : [],
      });
    }
    return acc;
  }, [] as any[]);

  // Get step links for each step
  const stepsWithPartsAndLinks = await Promise.all(stepsWithParts.map(async step => {
    const links = await db.select().from(stepLinks).where(eq(stepLinks.stepId, step.id));
    return {
      ...step,
      step_links: links.map(link => ({
        x1: Number(link.x1),
        y1: Number(link.y1),
        x2: Number(link.x2),
        y2: Number(link.y2),
        curvature: link.curvature ? Number(link.curvature) : 0.25,
        strokeWidth: link.strokeWidth ? Number(link.strokeWidth) : 0.5,
      })),
    };
  }));

  return {
    ...sequence,
    steps: stepsWithPartsAndLinks,
  };
}

export async function getAllSequences(limit = 1000) {
  return await db.select().from(sequences).orderBy(sequences.id).limit(limit);
}

export async function createSequence({ title, description }: { title: string; description?: string | null }) {
  const result = await db.insert(sequences).values({ title, description }).returning({ id: sequences.id });
  return result[0];
}

export async function updateSequence(id: number, { title, description }: { title: string; description?: string | null }) {
  await db.update(sequences).set({ title, description }).where(eq(sequences.id, id));
  return { id };
}

// Steps operations
export async function createStep({ sequenceId, title, description, brainpartIds }: { sequenceId: number; title: string; description?: string | null; brainpartIds?: number[] }) {
  const result = await db.insert(steps).values({ sequenceId, title, description }).returning({ id: steps.id });
  const stepId = result[0].id;
  
  // Add brainpart associations if provided
  if (brainpartIds && brainpartIds.length > 0) {
    await db.insert(stepBrainparts).values(
      brainpartIds.map(brainpartId => ({ stepId, brainpartId }))
    );
  }
  
  return result[0];
}

export async function updateStep(id: number, { title, description, brainpartIds }: { title: string; description?: string | null; brainpartIds?: number[] }) {
  await db.update(steps).set({ title, description }).where(eq(steps.id, id));
  
  // Update brainpart associations if provided
  if (brainpartIds !== undefined) {
    // Remove all existing associations
    await db.delete(stepBrainparts).where(eq(stepBrainparts.stepId, id));
    
    // Add new associations
    if (brainpartIds.length > 0) {
      await db.insert(stepBrainparts).values(
        brainpartIds.map(brainpartId => ({ stepId: id, brainpartId }))
      );
    }
  }
  
  return { id };
}

export async function deleteStep(id: number) {
  await db.delete(steps).where(eq(steps.id, id));
}

// Step Links operations
export async function updateStepLinks(stepId: number, links: any[]) {
  // Delete existing links for this step
  await db.delete(stepLinks).where(eq(stepLinks.stepId, stepId));
  
  // Insert new links
  if (links && links.length > 0) {
    await db.insert(stepLinks).values(
      links.map(link => ({
        stepId,
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

export async function createBrainpart({ title, description, isPartOf }: { title: string; description?: string | null; isPartOf?: number | null }) {
  const result = await db.insert(brainparts).values({ title, description, isPartOf }).returning({ id: brainparts.id });
  return result[0];
}

export async function getBrainpart(id: number) {
  const [brainpart] = await db.select().from(brainparts).where(eq(brainparts.id, id)).limit(1);
  if (!brainpart) return null;

  const links = await db.select({ url: brainpartLinks.url }).from(brainpartLinks).where(eq(brainpartLinks.brainpartId, id));
  
  return {
    ...brainpart,
    links: links.map(l => l.url),
  };
}

export async function getAllBrainparts(limit = 1000) {
  return await db.select().from(brainparts).orderBy(brainparts.id).limit(limit);
}

export async function updateBrainpart(id: number, { title, description, isPartOf }: { title: string; description?: string | null; isPartOf?: number | null }) {
  await db.update(brainparts).set({ title, description, isPartOf }).where(eq(brainparts.id, id));
  return { id };
}

export async function deleteBrainpart(id: number) {
  await db.delete(brainparts).where(eq(brainparts.id, id));
}

export async function addLinkToBrainpart(brainpartId: number, url: string) {
  await db.insert(brainpartLinks).values({ brainpartId, url });
}

// Arrows operations
export async function createArrow({ description, fromBrainpartId, toBrainpartId, stepId }: { description?: string | null; fromBrainpartId: number; toBrainpartId: number; stepId: number }) {
  const result = await db.insert(arrows).values({ description, fromBrainpartId, toBrainpartId, stepId }).returning({ id: arrows.id });
  return result[0];
}

export async function getStepArrows(stepId: number) {
  return await db
    .select({
      arrow: arrows,
      fromTitle: brainparts.title,
      toTitle: brainparts.title,
    })
    .from(arrows)
    .innerJoin(brainparts, eq(arrows.fromBrainpartId, brainparts.id))
    .innerJoin(brainparts, eq(arrows.toBrainpartId, brainparts.id))
    .where(eq(arrows.stepId, stepId));
}

// =======================
// User & Auth operations
// =======================

export async function getUserById(id: number) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

export async function getAllUsers() {
  return await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: 'user' | 'admin') {
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { id: userId };
}

export async function deleteUser(userId: number) {
  // Foreign key constraints with CASCADE will automatically delete:
  // - user's sessions
  // - user's sequences (which cascade to steps, step_brainparts, arrows, collaborators, invitations)
  // - user's password resets
  await db.delete(users).where(eq(users.id, userId));
}

// ================================
// Sequence Collaborators operations
// ================================

export async function addCollaborator({ sequenceId, userId, permissionLevel = 'editor' }: { sequenceId: number; userId: number; permissionLevel?: string }) {
  const result = await db.insert(sequenceCollaborators).values({
    sequenceId,
    userId,
    permissionLevel,
  }).returning({ id: sequenceCollaborators.id });
  return result[0];
}

export async function removeCollaborator(sequenceId: number, userId: number) {
  await db.delete(sequenceCollaborators).where(
    and(
      eq(sequenceCollaborators.sequenceId, sequenceId),
      eq(sequenceCollaborators.userId, userId)
    )
  );
}

export async function getSequenceCollaborators(sequenceId: number) {
  return await db
    .select({
      id: sequenceCollaborators.id,
      userId: users.id,
      email: users.email,
      permissionLevel: sequenceCollaborators.permissionLevel,
      createdAt: sequenceCollaborators.createdAt,
    })
    .from(sequenceCollaborators)
    .innerJoin(users, eq(sequenceCollaborators.userId, users.id))
    .where(eq(sequenceCollaborators.sequenceId, sequenceId));
}

export async function isUserCollaborator(sequenceId: number, userId: number): Promise<boolean> {
  const [result] = await db
    .select({ id: sequenceCollaborators.id })
    .from(sequenceCollaborators)
    .where(
      and(
        eq(sequenceCollaborators.sequenceId, sequenceId),
        eq(sequenceCollaborators.userId, userId)
      )
    )
    .limit(1);
  return !!result;
}

// =======================
// Invitations operations
// =======================

export async function createInvitation({
  token,
  sequenceId,
  email,
  invitedBy,
  expiresAt,
}: {
  token: string;
  sequenceId: number;
  email: string;
  invitedBy: number;
  expiresAt: number;
}) {
  const result = await db.insert(invitations).values({
    token,
    sequenceId,
    email,
    invitedBy,
    expiresAt,
  }).returning({ id: invitations.id });
  return result[0];
}

export async function getInvitationByToken(token: string) {
  const [invitation] = await db
    .select({
      invitation: invitations,
      sequenceTitle: sequences.title,
      inviterEmail: users.email,
    })
    .from(invitations)
    .innerJoin(sequences, eq(invitations.sequenceId, sequences.id))
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.token, token))
    .limit(1);
  return invitation || null;
}

export async function markInvitationAccepted(token: string) {
  await db.update(invitations)
    .set({ acceptedAt: Date.now() })
    .where(eq(invitations.token, token));
}

export async function getSequenceInvitations(sequenceId: number) {
  return await db
    .select({
      id: invitations.id,
      email: invitations.email,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      createdAt: invitations.createdAt,
      inviterEmail: users.email,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.invitedBy, users.id))
    .where(eq(invitations.sequenceId, sequenceId));
}

export async function deleteInvitation(id: number) {
  await db.delete(invitations).where(eq(invitations.id, id));
}

// ==================================
// Ownership & Permission checks
// ==================================

export async function isSequenceOwner(sequenceId: number, userId: number): Promise<boolean> {
  const [sequence] = await db
    .select({ userId: sequences.userId })
    .from(sequences)
    .where(eq(sequences.id, sequenceId))
    .limit(1);
  return sequence?.userId === userId;
}

export async function canEditSequence(sequenceId: number, userId: number): Promise<boolean> {
  // User can edit if they're the owner OR a collaborator
  const isOwner = await isSequenceOwner(sequenceId, userId);
  if (isOwner) return true;
  
  return await isUserCollaborator(sequenceId, userId);
}

export async function getUserSequences(userId: number) {
  return await db.select().from(sequences).where(eq(sequences.userId, userId)).orderBy(sequences.id);
}

export async function getPublishedSequences() {
  const allPublished = await db.select().from(sequences).where(
    and(
      eq(sequences.draft, 0),
      eq(sequences.isPublishedVersion, 1)
    )
  ).orderBy(sequences.id);
  
  // Get all draft sequences to find which published sequences have active drafts
  const drafts = await db.select({
    publishedVersionId: sequences.publishedVersionId
  }).from(sequences).where(
    and(
      eq(sequences.draft, 1),
      // Only consider drafts that reference a published version
      // Use sql operator for IS NOT NULL check
    )
  );
  
  // Create a set of published IDs that have active drafts
  const publishedIdsWithDrafts = new Set(
    drafts
      .filter(d => d.publishedVersionId !== null)
      .map(d => d.publishedVersionId)
  );
  
  // Filter out published sequences that have active drafts
  return allPublished.filter(s => !publishedIdsWithDrafts.has(s.id));
}

export async function getMySequences(userId: number) {
  // Get sequences where user is owner OR collaborator
  const ownedSequences = await db.select().from(sequences).where(eq(sequences.userId, userId)).orderBy(sequences.id);
  
  const collaboratorSequences = await db
    .select({
      id: sequences.id,
      title: sequences.title,
      description: sequences.description,
      userId: sequences.userId,
      draft: sequences.draft,
      publishedVersionId: sequences.publishedVersionId,
      isPublishedVersion: sequences.isPublishedVersion,
      currentlyEditedBy: sequences.currentlyEditedBy,
      lastEditedAt: sequences.lastEditedAt,
      createdAt: sequences.createdAt,
    })
    .from(sequenceCollaborators)
    .innerJoin(sequences, eq(sequenceCollaborators.sequenceId, sequences.id))
    .where(eq(sequenceCollaborators.userId, userId))
    .orderBy(sequences.id);
  
  // Combine and deduplicate by id
  const allSequences = [...ownedSequences];
  const ownedIds = new Set(ownedSequences.map(s => s.id));
  
  for (const seq of collaboratorSequences) {
    if (!ownedIds.has(seq.id)) {
      allSequences.push(seq);
    }
  }
  
  // Filter out published versions when a draft exists
  // If a draft has publishedVersionId set, remove the published version from the list
  const draftPublishedIds = new Set(
    allSequences
      .filter(s => s.draft === 1 && s.publishedVersionId !== null)
      .map(s => s.publishedVersionId)
  );
  
  const filteredSequences = allSequences.filter(s => {
    // Keep the sequence if it's NOT a published version that has a corresponding draft
    return !draftPublishedIds.has(s.id);
  });
  
  return filteredSequences.sort((a, b) => a.id - b.id);
}

export async function createDraftFromPublished(publishedSequenceId: number, userId: number) {
  console.log(`Creating draft from published sequence ${publishedSequenceId} for user ${userId}`);
  
  // Check if a draft already exists for this published sequence
  const [existingDraft] = await db
    .select()
    .from(sequences)
    .where(
      and(
        eq(sequences.publishedVersionId, publishedSequenceId),
        eq(sequences.draft, 1)
      )
    )
    .limit(1);
  
  if (existingDraft) {
    console.log(`Draft already exists with ID ${existingDraft.id}`);
    // Draft already exists, return its ID
    return { id: existingDraft.id };
  }
  
  // Get the published sequence with all its steps
  const publishedSequence = await getSequence(publishedSequenceId);
  if (!publishedSequence) {
    throw new Error('Published sequence not found');
  }
  
  console.log(`Published sequence has ${publishedSequence.steps?.length || 0} steps`);
  
  // Create draft sequence
  const [draftSequence] = await db.insert(sequences).values({
    title: publishedSequence.title,
    description: publishedSequence.description,
    userId: publishedSequence.userId,
    draft: 1,
    publishedVersionId: publishedSequenceId,
    isPublishedVersion: 0,
    currentlyEditedBy: userId,
    lastEditedAt: Date.now(),
  }).returning({ id: sequences.id });
  
  const draftSequenceId = draftSequence.id;
  console.log(`Created draft sequence with ID ${draftSequenceId}`);
  
  // Copy all steps
  if (publishedSequence.steps && publishedSequence.steps.length > 0) {
    const stepIdMap = new Map(); // Maps old step ID to new step ID
    
    for (const step of publishedSequence.steps) {
      console.log(`Copying step ${step.id}: ${step.title}`);
      const [newStep] = await db.insert(steps).values({
        sequenceId: draftSequenceId,
        title: step.title,
        description: step.description,
        draft: 1, // Mark step as draft
      }).returning({ id: steps.id });
      
      stepIdMap.set(step.id, newStep.id);
      console.log(`Created new step ${newStep.id} (from ${step.id})`);
      
      // Copy step_brainparts associations
      if (step.brainpart_ids && step.brainpart_ids.length > 0) {
        await db.insert(stepBrainparts).values(
          step.brainpart_ids.map((brainpartId: number) => ({
            stepId: newStep.id,
            brainpartId,
          }))
        );
        console.log(`Copied ${step.brainpart_ids.length} brainpart associations`);
      }
      
      // Copy step_links
      if (step.step_links && step.step_links.length > 0) {
        await db.insert(stepLinks).values(
          step.step_links.map((link: any) => ({
            stepId: newStep.id,
            x1: link.x1,
            y1: link.y1,
            x2: link.x2,
            y2: link.y2,
            curvature: link.curvature,
            strokeWidth: link.strokeWidth,
          }))
        );
        console.log(`Copied ${step.step_links.length} step links`);
      }
    }
    
    // Copy arrows for all the steps we copied
    // Get all arrows that belong to any of the original steps
    const originalStepIds = publishedSequence.steps.map(s => s.id);
    if (originalStepIds.length > 0) {
      const arrowsResult = await db
        .select()
        .from(arrows)
        .where(inArray(arrows.stepId, originalStepIds));
      
      if (arrowsResult.length > 0) {
        await db.insert(arrows).values(
          arrowsResult.map((arrow) => ({
            description: arrow.description,
            fromBrainpartId: arrow.fromBrainpartId,
            toBrainpartId: arrow.toBrainpartId,
            stepId: stepIdMap.get(arrow.stepId) || arrow.stepId,
          }))
        );
        console.log(`Copied ${arrowsResult.length} arrows`);
      }
    }
  } else {
    console.log('No steps to copy');
  }
  
  console.log(`Draft creation complete, returning ID ${draftSequenceId}`);
  return { id: draftSequenceId };
}

export async function updateSequenceOwner(sequenceId: number, newOwnerId: number) {
  await db.update(sequences).set({ userId: newOwnerId }).where(eq(sequences.id, sequenceId));
  return { id: sequenceId };
}

// =======================
// Email verification & Password reset operations
// =======================

export async function updateUserVerification(userId: number, emailVerified: boolean, verificationToken: string | null = null) {
  await db.update(users)
    .set({ emailVerified: emailVerified ? 1 : 0, verificationToken })
    .where(eq(users.id, userId));
}

export async function getUserByVerificationToken(token: string) {
  const [user] = await db.select().from(users).where(eq(users.verificationToken, token)).limit(1);
  return user || null;
}

export async function createPasswordReset(userId: number, token: string, expiresAt: number) {
  await db.insert(passwordResets).values({
    userId,
    token,
    expiresAt,
  });
}

export async function getPasswordResetByToken(token: string) {
  const [reset] = await db
    .select({
      reset: passwordResets,
      user: users,
    })
    .from(passwordResets)
    .innerJoin(users, eq(passwordResets.userId, users.id))
    .where(eq(passwordResets.token, token))
    .limit(1);
  return reset || null;
}

export async function markPasswordResetUsed(token: string) {
  await db.update(passwordResets)
    .set({ usedAt: Date.now() })
    .where(eq(passwordResets.token, token));
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.id, userId));
}