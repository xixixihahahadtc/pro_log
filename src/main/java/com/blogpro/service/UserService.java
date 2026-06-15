package com.blogpro.service;

import com.blogpro.model.dto.request.LoginRequest;
import com.blogpro.model.dto.request.RegisterRequest;
import com.blogpro.model.dto.response.LoginResponse;

/**
 * 用户服务接口
 * 不再直接操作 Entity，改为使用 DTO
 */
public interface UserService {
    /** 注册 — 接收 DTO，不返回字符串而是抛异常处理错误 */
    void register(RegisterRequest request);

    /** 登录 — 返回包含 token 的响应对象 */
    LoginResponse login(LoginRequest request);

    /** 刷新令牌 — 用 refreshToken 换取新的 token 对 */
    LoginResponse refreshAccessToken(String refreshToken);
}
