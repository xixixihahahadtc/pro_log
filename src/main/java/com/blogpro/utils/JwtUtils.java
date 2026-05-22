package com.blogpro.utils;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import java.util.Date;

public class JwtUtils {
    private static final String SECRET = "BlogProKey_123456";
    private static final long EXPIRE = 1000 * 60 * 60 * 24;

    public static String creatToken(Integer userId,String username){
        return Jwts.builder()
                .setSubject("USER_LOGIN")
                .claim("userId",userId)
                .claim("username",username)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE))
                .signWith(SignatureAlgorithm.HS256,SECRET)
                .compact();
    }
}
