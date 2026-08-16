CREATE TABLE `billItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(160) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	CONSTRAINT `billItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`billNumber` varchar(32) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`archivedAt` timestamp,
	CONSTRAINT `bills_id` PRIMARY KEY(`id`),
	CONSTRAINT `bills_billNumber_unique` UNIQUE(`billNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productCode` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`category` varchar(100) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productCode_unique` UNIQUE(`productCode`)
);
