
// Drizzle ORM relation mappings for SQLite tables
import { relations } from "drizzle-orm/relations";
import { sequences, steps, brainparts, brainpartLinks, stepBrainparts, arrows } from "./schema";


// Each step belongs to a sequence, can have many brainparts and arrows
export const stepsRelations = relations(steps, ({one, many}) => ({
	sequence: one(sequences, {
		fields: [steps.sequenceId],
		references: [sequences.id]
	}),
	stepBrainparts: many(stepBrainparts),
	arrows: many(arrows),
}));


// Each sequence has many steps
export const sequencesRelations = relations(sequences, ({many}) => ({
	steps: many(steps),
}));


// Each brainpart link belongs to a brainpart
export const brainpartLinksRelations = relations(brainpartLinks, ({one}) => ({
	brainpart: one(brainparts, {
		fields: [brainpartLinks.brainpartId],
		references: [brainparts.id]
	}),
}));


// Each brainpart can have many links, step associations, and arrows (as source or target)
export const brainpartsRelations = relations(brainparts, ({many}) => ({
	brainpartLinks: many(brainpartLinks),
	stepBrainparts: many(stepBrainparts),
	arrows_toBrainpartId: many(arrows, {
		relationName: "arrows_toBrainpartId_brainparts_id"
	}),
	arrows_fromBrainpartId: many(arrows, {
		relationName: "arrows_fromBrainpartId_brainparts_id"
	}),
}));


// Each step-brainpart association links a step and a brainpart
export const stepBrainpartsRelations = relations(stepBrainparts, ({one}) => ({
	brainpart: one(brainparts, {
		fields: [stepBrainparts.brainpartId],
		references: [brainparts.id]
	}),
	step: one(steps, {
		fields: [stepBrainparts.stepId],
		references: [steps.id]
	}),
}));


// Each arrow links a step and two brainparts (from and to)
export const arrowsRelations = relations(arrows, ({one}) => ({
	step: one(steps, {
		fields: [arrows.stepId],
		references: [steps.id]
	}),
	brainpart_toBrainpartId: one(brainparts, {
		fields: [arrows.toBrainpartId],
		references: [brainparts.id],
		relationName: "arrows_toBrainpartId_brainparts_id"
	}),
	brainpart_fromBrainpartId: one(brainparts, {
		fields: [arrows.fromBrainpartId],
		references: [brainparts.id],
		relationName: "arrows_fromBrainpartId_brainparts_id"
	}),
}));