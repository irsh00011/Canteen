CREATE TABLE `billSequences` (
	`dateKey` varchar(8) NOT NULL,
	`nextNumber` int NOT NULL DEFAULT 1,
	CONSTRAINT `billSequences_dateKey` PRIMARY KEY(`dateKey`)
);
