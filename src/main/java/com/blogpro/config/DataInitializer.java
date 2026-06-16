package com.blogpro.config;

import com.blogpro.entity.Category;
import com.blogpro.entity.User;
import com.blogpro.mapper.CategoryMapper;
import com.blogpro.mapper.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

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

        // 2. 确保至少有一个管理员：无 ADMIN 时自动提升最早注册的用户
        long adminCount = userMapper.selectCount(
                new QueryWrapper<User>().eq("role", "ADMIN"));
        if (adminCount == 0) {
            User firstUser = userMapper.selectOne(
                    new QueryWrapper<User>().orderByAsc("id").last("LIMIT 1"));
            if (firstUser != null && !"ADMIN".equals(firstUser.getRole())) {
                firstUser.setRole("ADMIN");
                userMapper.updateById(firstUser);
                log.info("已自动提升用户「{}」为管理员（ADMIN）", firstUser.getUsername());
            }
        }
    }
}
