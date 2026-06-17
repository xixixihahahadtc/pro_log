package com.blogpro.model.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserResponse {
    private Integer id;
    private String username;
    private String nickname;
    private String avatarUrl;
    private LocalDateTime createdAt;
}
