package com.blogpro.config;

import com.blogpro.entity.Category;
import com.blogpro.entity.User;
import com.blogpro.mapper.CategoryMapper;
import com.blogpro.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;

/**
 * 初始化默认数据（首次启动时）
 * 只在表为空时插入，不会覆盖已有数据
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CategoryMapper categoryMapper;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_PASSWORD:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        // 1. 初始化默认分类
        long count = categoryMapper.selectCount(new QueryWrapper<>());
        if (count == 0) {
            String[][] defaults = {
                    {"技术", "tech"},
                    {"生活", "life"},
                    {"随笔", "essay"},
                    {"教程", "tutorial"},
            };
            for (String[] c : defaults) {
                Category category = new Category();
                category.setName(c[0]);
                category.setSlug(c[1]);
                categoryMapper.insert(category);
            }
            log.info("已初始化 {} 个默认分类", defaults.length);
        }

        // 2. 初始化管理员账号（通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD）
        if (StringUtils.hasText(adminUsername) && StringUtils.hasText(adminPassword)) {
            User existing = userMapper.selectOne(
                    new QueryWrapper<User>().eq("username", adminUsername));
            if (existing == null) {
                User admin = new User();
                admin.setUsername(adminUsername);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setNickname(adminUsername);
                admin.setRole("ADMIN");
                userMapper.insert(admin);
                log.info("已创建管理员账号：{}（ADMIN）", adminUsername);
            } else {
                // 已存在则同步密码和角色（.env 配置始终生效）
                existing.setPassword(passwordEncoder.encode(adminPassword));
                existing.setRole("ADMIN");
                userMapper.updateById(existing);
                log.info("已同步管理员账号：{}（ADMIN，密码已更新）", adminUsername);
            }
        }
    }
}
