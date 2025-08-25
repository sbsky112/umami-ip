-- CreateTable
CREATE TABLE `setting` (
    `setting_id` VARCHAR(36) NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL,

    UNIQUE INDEX `setting_setting_id_key`(`setting_id`),
    UNIQUE INDEX `setting_key_key`(`key`),
    PRIMARY KEY (`setting_id`)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;