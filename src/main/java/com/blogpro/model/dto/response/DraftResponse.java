package com.blogpro.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 草稿响应 DTO
 */
@Data
public class DraftResponse {
    private Integer id;
    private String title;
    private String content;
    private String summary;
    private String coverImageUrl;
    private Integer categoryId;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
