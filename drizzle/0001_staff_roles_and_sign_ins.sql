CREATE TABLE `roles` (
	`name` varchar(20) NOT NULL,
	`label` varchar(60) NOT NULL,
	`permissions` json NOT NULL,
	`system` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `roles_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
-- The built-in roles (src/lib/permissions.ts). "admin" always has every
-- permission; employee's can be changed in the admin panel.
INSERT INTO `roles` (`name`, `label`, `permissions`, `system`) VALUES
	('admin', 'Admin', '["dashboard.view","customers.view","customers.manage","billing.manage","messages.view","messages.manage","activity.view","staff.manage"]', true),
	('employee', 'Employee', '["dashboard.view","customers.view","customers.manage"]', true),
	('customer', 'Customer', '[]', true);
--> statement-breakpoint
CREATE TABLE `sign_in_events` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`session_id` char(36),
	`ip_address` varchar(45),
	`user_agent` text,
	`signed_in_at` datetime(3) NOT NULL,
	`signed_out_at` datetime(3),
	CONSTRAINT `sign_in_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sign_in_events` ADD CONSTRAINT `sign_in_events_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `sign_in_events_user_id_signed_in_at_idx` ON `sign_in_events` (`user_id`,`signed_in_at`);--> statement-breakpoint
CREATE INDEX `sign_in_events_signed_in_at_idx` ON `sign_in_events` (`signed_in_at`);--> statement-breakpoint
CREATE INDEX `sign_in_events_session_id_idx` ON `sign_in_events` (`session_id`);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_role_roles_name_fk` FOREIGN KEY (`role`) REFERENCES `roles`(`name`) ON DELETE no action ON UPDATE cascade;