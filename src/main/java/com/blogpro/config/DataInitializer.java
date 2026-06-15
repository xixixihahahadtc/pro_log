package com.blogpro.config;

import com.blogpro.entity.Category;
import com.blogpro.mapper.CategoryMapper;
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

    @Override
    public void run(String... args) {
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
    }
}
