package com.blogpro.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 标签实体 — 对应 tag 表
 * 一篇文章可以有多个标签（多对多关系）
 */
@Data
@TableName("tag")
public class Tag {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String name;
    private String slug;
    private LocalDateTime createdAt;
}
