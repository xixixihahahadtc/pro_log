package com.blogpro.model.dto.response;

import lombok.Data;

/**
 * 登录响应 DTO
 * 包含访问令牌和刷新令牌（双令牌机制）
 */
@Data
public class LoginResponse {
    private String accessToken;
    private String refreshToken;
    private String nickname;
}
