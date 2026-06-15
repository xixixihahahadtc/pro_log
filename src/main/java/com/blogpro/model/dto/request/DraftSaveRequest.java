package com.blogpro.model.dto.request;

import lombok.Data;

/**
 * 草稿保存请求 DTO
 * 所有字段均可选（自动保存可能只有部分字段有值）
 */
@Data
public class DraftSaveRequest {
    private Integer id;          // 已有草稿则传 id 更新，不传则新建
    private String title;
    private String content;
    private String summary;
    private String coverImageUrl;
    private Integer categoryId;
}
