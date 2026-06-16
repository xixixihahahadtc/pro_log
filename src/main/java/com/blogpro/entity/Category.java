package com.blogpro.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import com.baomidou.mybatisplus.annotation.TableField;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章分类实体 — 对应 category 表
 * 支持二级分类：parent_id = NULL 是顶级分类，有值的是子分类
 *
 * 例如：
 *   顶级: "技术" (parent_id=NULL)
 *   子级: "后端开发" (parent_id=技术的id)
 */
@Data
@TableName("category")
public class Category {
    @TableId(type = IdType.AUTO)
    private Integer id;
    private String name;
    private String slug;
    private String description;
    private Integer parentId;    // 父分类ID
    private Integer sortOrder;   // 排序号
    private LocalDateTime createdAt;

    /** 子分类列表 — 只用于返回给前端，不存在数据库 */
    @TableField(exist = false)
    private List<Category> children;
}
