package com.blogpro.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 评论实体 — 对应 comment 表
 * 支持楼中楼：parent_id 指向父评论
 */
@Data
@TableName("comment")
public class Comment {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private Integer articleId;
    private Integer userId;
    private Integer parentId;    // NULL=顶级评论, 非NULL=回复某条评论
    private String content;
    private String status;       // PENDING / APPROVED / REJECTED
    private LocalDateTime createdAt;
}
