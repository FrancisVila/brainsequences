import { sqliteTable, integer, text, numeric, foreignKey, primaryKey } from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"



export const sequences = sqliteTable("sequences", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
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

