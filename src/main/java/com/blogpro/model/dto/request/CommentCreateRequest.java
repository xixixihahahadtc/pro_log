package com.blogpro.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建评论请求 DTO
 */
@Data
public class CommentCreateRequest {
    @NotBlank(message = "评论内容不能为空")
    private String content;

    private Integer parentId;  // 回复某条评论时传，顶级评论不传
}
