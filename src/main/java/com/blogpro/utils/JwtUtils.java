package com.blogpro.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 工具类 — jjwt 0.12.6 新版 API
 *
 * 改为 @Component：不再用静态方法，而是注入到 Service 中使用
 * 密钥从 application.yml 读取，不再是硬编码
 */
@Component
public class JwtUtils {

    private final SecretKey secretKey;
    private final long accessExpireMs;
    private final long refreshExpireMs;

    /**
     * 构造器注入配置值
     * @param secret 从 ${blog.jwt.secret} 读取
     * @param accessExpireMs 访问令牌过期时间（毫秒）
     * @param refreshExpireMs 刷新令牌过期时间（毫秒）
     */
    public JwtUtils(
            @Value("${blog.jwt.secret}") String secret,
            @Value("${blog.jwt.access-expire-ms}") long accessExpireMs,
            @Value("${blog.jwt.refresh-expire-ms}") long refreshExpireMs) {
        // 将字符串密钥转换为 HMAC-SHA256 专用密钥对象
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessExpireMs = accessExpireMs;
        this.refreshExpireMs = refreshExpireMs;
    }

    /** 创建访问令牌（短期有效，用于日常请求认证） */
    public String createAccessToken(Integer userId, String username, String role) {
        return buildToken(userId, username, role, accessExpireMs);
    }

    /** 创建刷新令牌（长期有效，用于无感刷新访问令牌） */
    public String createRefreshToken(Integer userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject("REFRESH_TOKEN")
                .claim("userId", userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + refreshExpireMs))
                .signWith(secretKey)
                .compact();
    }

    /** 从令牌中解析出所有 Claims（载荷数据） */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)  // 验证签名
                .build()
                .parseSignedClaims(token)  // 解析
                .getPayload();
    }

    /** 验证令牌是否有效（签名正确且未过期） */
    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /** 从令牌中取出 userId */
    public Integer getUserId(String token) {
        return getClaims(token).get("userId", Integer.class);
    }

    /** 从令牌中取出 username */
    public String getUsername(String token) {
        return getClaims(token).get("username", String.class);
    }

    /** 从令牌中取出 role */
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    // ---- 内部方法 ----

    private String buildToken(Integer userId, String username, String role, long expireMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject("USER_LOGIN")              // 主题
                .claim("userId", userId)            // 自定义字段
                .claim("username", username)        // 自定义字段
                .claim("role", role)
                .issuedAt(now)                      // 签发时间
                .expiration(new Date(now.getTime() + expireMs))  // 过期时间
                .signWith(secretKey)                // 签名
                .compact();                         // 生成字符串
    }
}
