package com.blogpro.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.blogpro.entity.Article;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ArticleMapper extends BaseMapper<Article> {
}
