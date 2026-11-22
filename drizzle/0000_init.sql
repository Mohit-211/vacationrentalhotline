CREATE TABLE `accounts` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(50) NOT NULL,
	`password` varchar(255),
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` datetime(3),
	`refresh_token_expires_at` datetime(3),
	`scope` text,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_provider_account_unique` UNIQUE(`provider_id`,`account_id`)
);
--> statement-breakpoint
CREATE TABLE `contact_messages` (
	`id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(255) NOT NULL,
	`phone` varchar(20),
	`message` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_items` (
	`id` char(36) NOT NULL,
	`payment_id` char(36) NOT NULL,
	`property_id` char(36),
	`property_label` varchar(500) NOT NULL,
	`amount_cents` int unsigned NOT NULL,
	`period_start` datetime(3) NOT NULL,
	`period_end` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `payment_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`subscription_id` char(36),
	`stripe_invoice_id` varchar(255) NOT NULL,
	`stripe_payment_intent_id` varchar(255),
	`billing_reason` varchar(40),
	`payer_name` varchar(150) NOT NULL,
	`payer_email` varchar(255) NOT NULL,
	`amount_cents` int unsigned NOT NULL,
	`refunded_cents` int unsigned NOT NULL DEFAULT 0,
	`currency` char(3) NOT NULL DEFAULT 'usd',
	`status` enum('paid','failed','partially_refunded','refunded') NOT NULL,
	`receipt_url` varchar(2048),
	`paid_at` datetime(3),
	`receipt_email_sent_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_stripe_invoice_id_unique` UNIQUE(`stripe_invoice_id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`owner_name` varchar(150) NOT NULL,
	`owner_email` varchar(255) NOT NULL,
	`owner_alt_email` varchar(255),
	`owner_phone` varchar(20) NOT NULL,
	`owner_alt_phone` varchar(20),
	`address_line_1` varchar(255) NOT NULL,
	`address_line_2` varchar(255),
	`city` varchar(100) NOT NULL,
	`region_code` varchar(3) NOT NULL,
	`country_code` char(2) NOT NULL,
	`postal_code` varchar(10) NOT NULL,
	`subscription_ends_at` datetime(3),
	`auto_renews` boolean NOT NULL DEFAULT false,
	`expiry_notice_sent_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `property_notes` (
	`id` char(36) NOT NULL,
	`property_id` char(36) NOT NULL,
	`author_id` char(36),
	`body` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `property_notes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` char(36) NOT NULL,
	`key` varchar(255) NOT NULL,
	`count` int NOT NULL,
	`last_request` bigint NOT NULL,
	CONSTRAINT `rate_limits_id` PRIMARY KEY(`id`),
	CONSTRAINT `rate_limits_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`ip_address` varchar(45),
	`user_agent` text,
	`impersonated_by` char(36),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `subscription_items` (
	`id` char(36) NOT NULL,
	`subscription_id` char(36) NOT NULL,
	`property_id` char(36),
	`property_label` varchar(500) NOT NULL,
	`stripe_subscription_item_id` varchar(255) NOT NULL,
	`unit_amount_cents` int unsigned NOT NULL,
	`currency` char(3) NOT NULL DEFAULT 'usd',
	`canceled_at` datetime(3),
	`canceled_by_id` char(36),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `subscription_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_items_stripe_item_unique` UNIQUE(`stripe_subscription_item_id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` char(36) NOT NULL,
	`user_id` char(36),
	`stripe_subscription_id` varchar(255) NOT NULL,
	`status` varchar(32) NOT NULL,
	`cancel_at_period_end` boolean NOT NULL DEFAULT false,
	`current_period_end` datetime(3),
	`canceled_at` datetime(3),
	`ended_at` datetime(3),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_stripe_subscription_id_unique` UNIQUE(`stripe_subscription_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` varchar(2048),
	`role` varchar(20) NOT NULL DEFAULT 'customer',
	`banned` boolean NOT NULL DEFAULT false,
	`ban_reason` varchar(500),
	`ban_expires` datetime(3),
	`phone` varchar(20),
	`street_address` varchar(255),
	`city` varchar(100),
	`region_code` varchar(3),
	`country_code` char(2),
	`postal_code` varchar(10),
	`stripe_customer_id` varchar(255),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_stripe_customer_id_unique` UNIQUE(`stripe_customer_id`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` char(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_items` ADD CONSTRAINT `payment_items_payment_id_payments_id_fk` FOREIGN KEY (`payment_id`) REFERENCES `payments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_items` ADD CONSTRAINT `payment_items_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `properties` ADD CONSTRAINT `properties_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_notes` ADD CONSTRAINT `property_notes_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `property_notes` ADD CONSTRAINT `property_notes_author_id_users_id_fk` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_items` ADD CONSTRAINT `subscription_items_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_items` ADD CONSTRAINT `subscription_items_property_id_properties_id_fk` FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_items` ADD CONSTRAINT `subscription_items_canceled_by_id_users_id_fk` FOREIGN KEY (`canceled_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_user_id_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE INDEX `contact_messages_created_at_idx` ON `contact_messages` (`created_at`);--> statement-breakpoint
CREATE INDEX `payment_items_payment_id_idx` ON `payment_items` (`payment_id`);--> statement-breakpoint
CREATE INDEX `payment_items_property_id_idx` ON `payment_items` (`property_id`);--> statement-breakpoint
CREATE INDEX `payments_user_id_created_at_idx` ON `payments` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `payments_subscription_id_idx` ON `payments` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `payments_status_paid_at_idx` ON `payments` (`status`,`paid_at`);--> statement-breakpoint
CREATE INDEX `properties_user_id_created_at_idx` ON `properties` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `properties_subscription_ends_at_idx` ON `properties` (`subscription_ends_at`);--> statement-breakpoint
CREATE INDEX `properties_created_at_idx` ON `properties` (`created_at`);--> statement-breakpoint
CREATE INDEX `property_notes_property_id_created_at_idx` ON `property_notes` (`property_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE INDEX `subscription_items_subscription_id_idx` ON `subscription_items` (`subscription_id`);--> statement-breakpoint
CREATE INDEX `subscription_items_property_id_idx` ON `subscription_items` (`property_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_id_idx` ON `subscriptions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_idx` ON `subscriptions` (`status`);--> statement-breakpoint
CREATE INDEX `users_role_created_at_idx` ON `users` (`role`,`created_at`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `verifications_expires_at_idx` ON `verifications` (`expires_at`);