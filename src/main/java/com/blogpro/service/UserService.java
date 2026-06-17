package com.blogpro.service;

import com.blogpro.model.dto.request.LoginRequest;
import com.blogpro.model.dto.request.RegisterRequest;
import com.blogpro.model.dto.response.LoginResponse;
import com.blogpro.model.dto.response.UserResponse;

public interface UserService {
    void register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
    LoginResponse refreshAccessToken(String refreshToken);
    UserResponse getUserById(Integer id);
}
