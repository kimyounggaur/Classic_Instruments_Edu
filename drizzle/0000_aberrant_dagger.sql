CREATE TABLE `classroom_completions` (
	`session_id` text NOT NULL,
	`mission_id` text NOT NULL,
	`user_id` text NOT NULL,
	`minutes` integer NOT NULL,
	`note` text NOT NULL,
	`completed_at` text NOT NULL,
	PRIMARY KEY(`session_id`, `mission_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `classroom_members` (
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`joined_at` text NOT NULL,
	PRIMARY KEY(`session_id`, `user_id`),
	FOREIGN KEY (`session_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `classroom_member_user_idx` ON `classroom_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `classrooms` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`instrument` text NOT NULL,
	`level` text NOT NULL,
	`mission_json` text NOT NULL,
	`mission_id` text NOT NULL,
	`join_code` text NOT NULL,
	`created_at` text NOT NULL,
	`closed_at` text
);
--> statement-breakpoint
CREATE INDEX `classroom_owner_idx` ON `classrooms` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `classroom_code_idx` ON `classrooms` (`join_code`);--> statement-breakpoint
CREATE TABLE `review_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`review_id` text NOT NULL,
	`action` text NOT NULL,
	`detail_json` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `review_audit_user_idx` ON `review_audit` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `user_states` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state_json` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
