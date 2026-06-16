package com.blogpro.controller;

import com.blogpro.annotation.RequireRole;
import com.blogpro.entity.Category;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /** 获取分类树（公开） */
    @GetMapping
    public ApiResponse<List<Category>> tree() {
        List<Category> tree = categoryService.getCategoryTree();
        return ApiResponse.success(tree);
    }

    /** 创建分类（管理员） */
    @PostMapping
    @RequireRole("ADMIN")
    public ApiResponse<Category> create(@RequestBody Category category) {
        Category created = categoryService.createCategory(category);
        return ApiResponse.success(created);
    }

    /** 更新分类（管理员） */
    @PutMapping("/{id}")
    @RequireRole("ADMIN")
    public ApiResponse<Category> update(@PathVariable Integer id,
                                        @RequestBody Category category) {
        Category updated = categoryService.updateCategory(id, category);
        return ApiResponse.success(updated);
    }

    /** 删除分类（管理员） */
    @DeleteMapping("/{id}")
    @RequireRole("ADMIN")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return ApiResponse.success(null);
    }
}
