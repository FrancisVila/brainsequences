
// Drizzle ORM relation mappings for SQLite tables
// Drizzle ORM relation mappings for SQLite tables
import { relations } from "drizzle-orm/relations";
import { sequences, steps, brainparts, brainpartLinks, stepBrainparts, arrows, users, sessions, sequenceCollaborators, invitations } from "./schema";


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
export const sequencesRelations = relations(sequences, ({one, many}) => ({
	steps: many(steps),
	user: one(users, {
		fields: [sequences.userId],
		references: [users.id]
	}),
	collaborators: many(sequenceCollaborators),
	invitations: many(invitations),
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

// Each user can have many sequences, sessions, invitations sent, and collaborations
export const usersRelations = relations(users, ({many}) => ({
	sequences: many(sequences),
	sessions: many(sessions),
	invitationsSent: many(invitations),
	collaborations: many(sequenceCollaborators),
}));

// Each session belongs to a user
export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

// Each collaborator entry links a user to a sequence
export const sequenceCollaboratorsRelations = relations(sequenceCollaborators, ({one}) => ({
	sequence: one(sequences, {
		fields: [sequenceCollaborators.sequenceId],
		references: [sequences.id]
	}),
	user: one(users, {
		fields: [sequenceCollaborators.userId],
		references: [users.id]
	}),
}));

// Each invitation belongs to a sequence and is sent by a user
export const invitationsRelations = relations(invitations, ({one}) => ({
	sequence: one(sequences, {
		fields: [invitations.sequenceId],
		references: [sequences.id]
	}),
	invitedByUser: one(users, {
		fields: [invitations.invitedBy],
		references: [users.id]
	}),
}));