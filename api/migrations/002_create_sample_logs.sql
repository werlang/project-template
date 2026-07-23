CREATE TABLE IF NOT EXISTS `sample_logs` (
    `id` int NOT NULL AUTO_INCREMENT,
    `action` varchar(255) NOT NULL,
    `details` text,
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
