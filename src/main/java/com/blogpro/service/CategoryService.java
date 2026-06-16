package com.blogpro.service;

import com.blogpro.entity.Category;

import java.util.List;

public interface CategoryService {
    /** 获取分类树（嵌套结构） */
    List<Category> getCategoryTree();
    /** 创建分类 */
    Category createCategory(Category category);
    /** 更新分类 */
    Category updateCategory(Integer id, Category category);
    /** 删除分类 */
    void deleteCategory(Integer id);
}
