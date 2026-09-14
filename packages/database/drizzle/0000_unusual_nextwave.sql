CREATE TABLE `font_faces` (
	`id` integer PRIMARY KEY NOT NULL,
	`family_id` integer NOT NULL,
	`weight` text,
	`style` text,
	`source_url` text,
	`format` text
);
--> statement-breakpoint
CREATE TABLE `font_families` (
	`id` integer PRIMARY KEY NOT NULL,
	`family_name` text NOT NULL,
	`category` text DEFAULT 'unknown' NOT NULL,
	`source_type` text DEFAULT 'unknown' NOT NULL,
	`popularity_score` real,
	`first_seen_at` text,
	`updated_at` text
);
--> statement-breakpoint
CREATE TABLE `font_mdn_refs` (
	`id` integer PRIMARY KEY NOT NULL,
	`family_id` integer NOT NULL,
	`mdn_slug` text NOT NULL,
	`description` text,
	`compatibility_note` text
);
--> statement-breakpoint
CREATE TABLE `font_sightings` (
	`id` integer PRIMARY KEY NOT NULL,
	`family_id` integer NOT NULL,
	`site_url` text NOT NULL,
	`site_domain` text NOT NULL,
	`page_title` text,
	`usage_count` integer,
	`mode` text NOT NULL,
	`detected_at` text DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `font_families_family_name_unique` ON `font_families` (`family_name`);