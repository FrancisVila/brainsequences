CREATE TABLE `arrows` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text,
	`from_brainpart_id` integer NOT NULL,
	`to_brainpart_id` integer NOT NULL,
	`step_id` integer NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`from_brainpart_id`) REFERENCES `brainparts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_brainpart_id`) REFERENCES `brainparts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `brainpart_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brainpart_id` integer NOT NULL,
	`url` text NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`brainpart_id`) REFERENCES `brainparts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `brainparts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP),
	`is_part_of` integer,
	`visible` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sequences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP)
);
--> statement-breakpoint
CREATE TABLE `step_brainparts` (
	`step_id` integer NOT NULL,
	`brainpart_id` integer NOT NULL,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP),
	PRIMARY KEY(`step_id`, `brainpart_id`),
	FOREIGN KEY (`step_id`) REFERENCES `steps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`brainpart_id`) REFERENCES `brainparts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `step_link` (
	`step_id` integer NOT NULL,
	`x1` numeric NOT NULL,
	`y1` numeric NOT NULL,
	`x2` numeric NOT NULL,
	`y2` numeric NOT NULL,
	`curvature` numeric,
	`strokeWidth` numeric,
	FOREIGN KEY (`step_id`) REFERENCES `steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sequence_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` numeric DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`sequence_id`) REFERENCES `sequences`(`id`) ON UPDATE no action ON DELETE cascade
);
