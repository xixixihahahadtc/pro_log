package com.blogpro.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文章实体 — 对应 article 表
 */
@Data
@TableName("article")
public class Article {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String title;
    private String slug;
    private String content;
    private String summary;
    private String coverImageUrl;
    private Integer authorId;
    private Integer categoryId;
    private String status;           // DRAFT / PUBLISHED / ARCHIVED
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private Boolean isAiGenerated;   // AI 生成标记
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime publishedAt;
}
