package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.blogpro.entity.User;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.UserMapper;
import com.blogpro.model.dto.request.LoginRequest;
import com.blogpro.model.dto.request.RegisterRequest;
import com.blogpro.model.dto.response.LoginResponse;
import com.blogpro.model.dto.response.UserResponse;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.UserService;
import com.blogpro.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 用户服务实现
 *
 * 改进点：
 * 1. 使用 DTO 而不是直接传 Entity
 * 2. 使用构造器注入（@RequiredArgsConstructor）代替 @Autowired
 * 3. 密码编码器由 SecurityConfig 统一管理
 * 4. 错误通过 BusinessException 抛出，由 GlobalExceptionHandler 统一处理
 * 5. JwtUtils 是注入的 Bean，不再是静态调用
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Override
    public void register(RegisterRequest request) {
        // 检查用户名是否已存在
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", request.getUsername());
        if (userMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "用户名已存在");
        }

        // 构建 User 实体并保存
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        // 昵称默认用用户名
        user.setNickname(request.getNickname() != null ? request.getNickname() : request.getUsername());
        user.setRole("USER");  // 默认普通用户角色
        userMapper.insert(user);
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        // 查询用户
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username", request.getUsername());
        User user = userMapper.selectOne(wrapper);

        // 验证密码（先查用户是否存在，再用 BCrypt 比对密码）
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "用户名或密码错误");
        }

        // 生成双令牌
        String accessToken = jwtUtils.createAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtUtils.createRefreshToken(user.getId());

        // 保存 refreshToken 到数据库（用于后续刷新或注销时失效）
        user.setRefreshToken(refreshToken);
        userMapper.updateById(user);

        // 构建响应
        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setNickname(user.getNickname());
        response.setRole(user.getRole());
        return response;
    }

    @Override
    public LoginResponse refreshAccessToken(String refreshToken) {
        // 1. 校验 refresh token 签名和过期时间
        if (!jwtUtils.validateToken(refreshToken)) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "refreshToken 无效或已过期");
        }

        // 2. 从 token 中提取 userId
        Integer userId = jwtUtils.getUserId(refreshToken);
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "用户不存在");
        }

        // 3. 验证 token 与数据库存储的一致（防止旧 token 被复用）
        if (!refreshToken.equals(user.getRefreshToken())) {
            throw new BusinessException(ResultCode.UNAUTHORIZED, "refreshToken 已被使用，请重新登录");
        }

        // 4. 签发新 token 对（轮转机制）
        String newAccessToken = jwtUtils.createAccessToken(user.getId(), user.getUsername(), user.getRole());
        String newRefreshToken = jwtUtils.createRefreshToken(user.getId());

        // 5. 更新数据库中的 refreshToken
        user.setRefreshToken(newRefreshToken);
        userMapper.updateById(user);

        // 6. 返回新 token 对
        LoginResponse response = new LoginResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setNickname(user.getNickname());
        response.setRole(user.getRole());
        return response;
    }

    @Override
    public UserResponse getUserById(Integer id) {
        User user = userMapper.selectById(id);
        if (user == null) throw new BusinessException(ResultCode.NOT_FOUND, "用户不存在");
        UserResponse resp = new UserResponse();
        resp.setId(user.getId());
        resp.setUsername(user.getUsername());
        resp.setNickname(user.getNickname());
        resp.setAvatarUrl(user.getAvatarUrl());
        resp.setCreatedAt(user.getCreatedAt());
        return resp;
    }
}
