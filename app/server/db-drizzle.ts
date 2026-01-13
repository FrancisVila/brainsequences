import { eq, and } from 'drizzle-orm';
import { db } from './drizzle';
import { sequences, steps, brainparts, brainpartLinks, stepBrainparts, arrows, stepLinks } from '../../drizzle/schema';


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