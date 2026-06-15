package com.blogpro.controller;

import com.blogpro.model.dto.request.LoginRequest;
import com.blogpro.model.dto.request.RefreshTokenRequest;
import com.blogpro.model.dto.request.RegisterRequest;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.model.dto.response.LoginResponse;
import com.blogpro.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 *
 * 改进点：
 * 1. 使用 DTO 接收请求（不再直接传 Entity）
 * 2. @Valid 触发 Jakarta Validation 校验
 * 3. 返回统一 ApiResponse 格式
 * 4. 构造器注入替代 @Autowired
 */
@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ApiResponse<Void> register(@Valid @RequestBody RegisterRequest request) {
        userService.register(request);
        return ApiResponse.success(null);
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = userService.login(request);
        return ApiResponse.success(response);
    }

    @PostMapping("/refresh")
    public ApiResponse<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = userService.refreshAccessToken(request.getRefreshToken());
        return ApiResponse.success(response);
    }
}
