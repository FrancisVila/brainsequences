import { sqliteTable, integer, text, numeric, foreignKey, primaryKey } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"



export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }),
	email: text().notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	role: text().notNull().default("user"), // 'user' or 'admin'
	emailVerified: integer("email_verified").notNull().default(0), // 0 = not verified, 1 = verified
	verificationToken: text("verification_token"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const sessions = sqliteTable("sessions", {
	id: text().primaryKey(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	expiresAt: numeric("expires_at").notNull(),
	lastActivityAt: numeric("last_activity_at").notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const sequences = sqliteTable("sequences", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
	userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
	draft: integer().notNull().default(1), // 0 = published, 1 = draft
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const steps = sqliteTable("steps", {
	id: integer().primaryKey({ autoIncrement: true }),
	sequenceId: integer("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" } ),
	title: text().notNull(),
	description: text(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const brainparts = sqliteTable("brainparts", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
	image: text(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
	isPartOf: integer("is_part_of"),
	visible: integer().notNull().default(1),
});

export const brainpartLinks = sqliteTable("brainpart_links", {
	id: integer().primaryKey({ autoIncrement: true }),
	brainpartId: integer("brainpart_id").notNull().references(() => brainparts.id, { onDelete: "cascade" } ),
	url: text().notNull(),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const stepBrainparts = sqliteTable("step_brainparts", {
	stepId: integer("step_id").notNull().references(() => steps.id, { onDelete: "cascade" } ),
	brainpartId: integer("brainpart_id").notNull().references(() => brainparts.id, { onDelete: "cascade" } ),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
},
(table) => [
	primaryKey({ columns: [table.stepId, table.brainpartId], name: "step_brainparts_step_id_brainpart_id_pk"})
]);

export const arrows = sqliteTable("arrows", {
	id: integer().primaryKey({ autoIncrement: true }),
	description: text(),
	fromBrainpartId: integer("from_brainpart_id").notNull().references(() => brainparts.id, { onDelete: "cascade" } ),
	toBrainpartId: integer("to_brainpart_id").notNull().references(() => brainparts.id, { onDelete: "cascade" } ),
	stepId: integer("step_id").notNull().references(() => steps.id, { onDelete: "cascade" } ),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const stepLinks = sqliteTable("step_link", {
	stepId: integer("step_id").notNull().references(() => steps.id, { onDelete: "cascade" } ),
	x1: numeric().notNull(),
	y1: numeric().notNull(),
	x2: numeric().notNull(),
	y2: numeric().notNull(),
	curvature: numeric(),
	strokeWidth: numeric("strokeWidth"),
});

export const sequenceCollaborators = sqliteTable("sequence_collaborators", {
	id: integer().primaryKey({ autoIncrement: true }),
	sequenceId: integer("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	permissionLevel: text("permission_level").notNull().default("editor"), // 'editor' only
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const invitations = sqliteTable("invitations", {
	id: integer().primaryKey({ autoIncrement: true }),
	token: text().notNull().unique(),
	sequenceId: integer("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
	email: text().notNull(),
	invitedBy: integer("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
	expiresAt: numeric("expires_at").notNull(),
	acceptedAt: numeric("accepted_at"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const passwordResets = sqliteTable("password_resets", {
	id: integer().primaryKey({ autoIncrement: true }),
	token: text().notNull().unique(),
	userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
	expiresAt: numeric("expires_at").notNull(),
	usedAt: numeric("used_at"),
	createdAt: numeric("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

