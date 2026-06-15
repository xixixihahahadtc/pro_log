package com.blogpro.config;

import com.blogpro.interceptor.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor  // Lombok：自动生成带 final 字段的构造器，用于注入 JwtAuthenticationFilter
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用 CSRF（前后端分离 + JWT 不需要 CSRF 保护）
            .csrf(csrf -> csrf.disable())
            // 无状态会话（JWT 自带状态，服务器不存 Session）
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 权限配置
            .authorizeHttpRequests(auth -> auth
                // 公开端点（无需认证）
                .requestMatchers("/user/register", "/user/login", "/user/refresh").permitAll()
                .requestMatchers("/swagger-ui*", "/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // 上传的图片公开访问
                .requestMatchers("/uploads/**").permitAll()
                // 博客公开读取
                .requestMatchers("GET", "/api/v1/articles/**").permitAll()
                .requestMatchers("POST", "/api/v1/articles/*/comments").permitAll()
                .requestMatchers("GET", "/api/v1/categories/**").permitAll()
                .requestMatchers("GET", "/api/v1/tags/**").permitAll()
                // AI 接口公开
                .requestMatchers("/api/v1/ai/**").permitAll()
                // 其余所有请求需要认证
                .anyRequest().authenticated()
            )
            // 在 Spring Security 的认证过滤器之前插入我们的 JWT 过滤器
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * 密码编码器 — BCrypt 是目前最安全的哈希算法之一
     * 每次加密自动生成随机盐值，同一密码两次加密结果不同
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
