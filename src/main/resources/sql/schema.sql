-- ============================================
-- AI Blog Pro 数据库初始化脚本
-- 用于 docker-compose 自动建表
-- ============================================

CREATE TABLE `user` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `username` VARCHAR(50) UNIQUE NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(50),
    `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `role` VARCHAR(20) DEFAULT 'USER' COMMENT '角色: USER/AUTHOR/ADMIN',
    `refresh_token` VARCHAR(500) DEFAULT NULL COMMENT 'JWT刷新令牌',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Phase 1: 博客核心表
-- ============================================

-- 文章分类表（支持二级分类：如 "技术" 下分 "后端"、"前端"）
CREATE TABLE `category` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL COMMENT '分类名',
    `slug` VARCHAR(50) UNIQUE NOT NULL COMMENT 'URL友好名，如 backend-dev',
    `description` VARCHAR(255) COMMENT '分类描述',
    `parent_id` INT DEFAULT NULL COMMENT '父分类ID，NULL表示顶级分类',
    `sort_order` INT DEFAULT 0 COMMENT '排序值，越小越靠前',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`parent_id`) REFERENCES `category`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 标签表（一篇文章可以有多个标签）
CREATE TABLE `tag` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL COMMENT '标签名',
    `slug` VARCHAR(50) UNIQUE NOT NULL COMMENT 'URL友好名',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文章表（核心表）
CREATE TABLE `article` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `title` VARCHAR(200) NOT NULL COMMENT '标题',
    `slug` VARCHAR(200) UNIQUE NOT NULL COMMENT 'URL友好名',
    `content` MEDIUMTEXT NOT NULL COMMENT '正文（MEDIUMTEXT=最大16MB）',
    `summary` VARCHAR(500) COMMENT '摘要',
    `cover_image_url` VARCHAR(500) COMMENT '封面图URL',
    `author_id` INT NOT NULL COMMENT '作者ID',
    `category_id` INT COMMENT '所属分类ID',
    `status` VARCHAR(20) DEFAULT 'DRAFT' COMMENT '状态: DRAFT=草稿, PUBLISHED=已发布, ARCHIVED=已归档',
    `view_count` INT DEFAULT 0 COMMENT '浏览次数',
    `like_count` INT DEFAULT 0 COMMENT '点赞次数',
    `comment_count` INT DEFAULT 0 COMMENT '评论次数（冗余字段，避免每次联表查询）',
    `is_ai_generated` BOOLEAN DEFAULT FALSE COMMENT '是否AI生成（Phase 2/5 使用）',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `published_at` DATETIME COMMENT '发布时间',
    FOREIGN KEY (`author_id`) REFERENCES `user`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `category`(`id`) ON DELETE SET NULL,
    INDEX `idx_slug` (`slug`),
    INDEX `idx_status_published` (`status`, `published_at`),
    INDEX `idx_author` (`author_id`),
    INDEX `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 文章-标签关联表（多对多中间表）
CREATE TABLE `article_tag` (
    `article_id` INT NOT NULL,
    `tag_id` INT NOT NULL,
    PRIMARY KEY (`article_id`, `tag_id`),
    FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`tag_id`) REFERENCES `tag`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 评论表（支持楼中楼回复：parent_id 指向父评论）
CREATE TABLE `comment` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `article_id` INT NOT NULL COMMENT '所属文章',
    `user_id` INT COMMENT '评论用户（NULL表示匿名）',
    `parent_id` INT DEFAULT NULL COMMENT '父评论ID（NULL=顶级评论，非NULL=回复某条评论）',
    `content` TEXT NOT NULL COMMENT '评论内容',
    `status` VARCHAR(20) DEFAULT 'PENDING' COMMENT '审核状态: PENDING=待审核, APPROVED=已通过, REJECTED=已拒绝',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`parent_id`) REFERENCES `comment`(`id`) ON DELETE CASCADE,
    INDEX `idx_article_status` (`article_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 用户点赞记录表（用于点赞/取消点赞 toggle）
CREATE TABLE `user_likes` (
    `user_id` INT NOT NULL,
    `article_id` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `article_id`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
