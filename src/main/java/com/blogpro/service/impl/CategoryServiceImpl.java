package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.blogpro.entity.Category;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.CategoryMapper;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryMapper categoryMapper;

    @Override
    public List<Category> getCategoryTree() {
        // 查出所有分类
        List<Category> all = categoryMapper.selectList(
                new QueryWrapper<Category>().orderByAsc("sort_order"));

        // 构建树形结构：先找顶级分类，再递归填子分类
        List<Category> tree = new ArrayList<>();
        for (Category cat : all) {
            if (cat.getParentId() == null) {
                tree.add(cat);
                fillChildren(cat, all);
            }
        }
        return tree;
    }

    /** 递归填充子分类 */
    private void fillChildren(Category parent, List<Category> all) {
        List<Category> children = new ArrayList<>();
        for (Category cat : all) {
            if (parent.getId().equals(cat.getParentId())) {
                children.add(cat);
                fillChildren(cat, all);  // 递归：子分类也可能有子分类
            }
        }
        parent.setChildren(children);
    }

    @Override
    public Category createCategory(Category category) {
        categoryMapper.insert(category);
        return category;
    }

    @Override
    public Category updateCategory(Integer id, Category category) {
        Category existing = categoryMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "分类不存在");
        }
        category.setId(id);
        categoryMapper.updateById(category);
        return categoryMapper.selectById(id);
    }

    @Override
    public void deleteCategory(Integer id) {
        // 检查是否有子分类
        QueryWrapper<Category> wrapper = new QueryWrapper<>();
        wrapper.eq("parent_id", id);
        if (categoryMapper.selectCount(wrapper) > 0) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "该分类下还有子分类，无法删除");
        }
        categoryMapper.deleteById(id);
    }
}
