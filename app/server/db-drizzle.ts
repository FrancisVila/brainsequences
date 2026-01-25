import { eq, and } from 'drizzle-orm';
import { db } from './drizzle';
import { sequences, steps, brainparts, brainpartLinks, stepBrainparts, arrows, stepLinks, users, sequenceCollaborators, invitations } from '../../drizzle/schema';


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
  return await db.select().from(sequences).where(eq(sequences.isPublished, 1)).orderBy(sequences.id);
}

export async function updateSequenceOwner(sequenceId: number, newOwnerId: number) {
  await db.update(sequences).set({ userId: newOwnerId }).where(eq(sequences.id, sequenceId));
  return { id: sequenceId };
}