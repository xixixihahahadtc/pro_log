package com.blogpro.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.blogpro.entity.Category;
import org.apache.ibatis.annotations.Mapper;

/**
 * CategoryMapper — 继承 BaseMapper 后自动拥有:
 * insert, deleteById, updateById, selectById, selectList, selectPage 等方法
 * 无需写一行 SQL
 */
@Mapper
public interface CategoryMapper extends BaseMapper<Category> {
}
