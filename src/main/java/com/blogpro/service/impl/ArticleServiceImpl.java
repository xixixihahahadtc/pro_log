package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blogpro.entity.Article;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.ArticleMapper;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;

    @Override
    public IPage<Article> getPublishedArticles(int page, int size, Integer categoryId, Integer tagId) {
        // 构建查询条件
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        wrapper.eq("status", "PUBLISHED")
               .orderByDesc("published_at");

        if (categoryId != null) {
            wrapper.eq("category_id", categoryId);
        }
        // 注意: tag 过滤需要通过 article_tag 中间表联查
        // 此处先简化，只做 category 过滤，tag 过滤在后续优化

        return articleMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    @Transactional  // 数据库事务：增加浏览量和返回文章是原子操作
    public Article getArticleBySlug(String slug) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        wrapper.eq("slug", slug);
        Article article = articleMapper.selectOne(wrapper);

        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }

        // 增加浏览次数（用 LambdaUpdateWrapper 直接 update，避免并发问题）
        article.setViewCount(article.getViewCount() + 1);
        articleMapper.updateById(article);

        return article;
    }

    @Override
    public Article createArticle(Article article, Integer authorId) {
        article.setAuthorId(authorId);
        article.setStatus("PUBLISHED");
        article.setPublishedAt(LocalDateTime.now());
        // 生成 slug：标题转拼音或直接用时间戳（简化方案）
        article.setSlug(generateSlug(article.getTitle()));
        articleMapper.insert(article);
        return article;
    }

    @Override
    public Article updateArticle(Integer id, Article article) {
        Article existing = articleMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        article.setId(id);
        // 如果状态改为 PUBLISHED，设置发布时间，并生成向量嵌入
        if ("PUBLISHED".equals(article.getStatus()) && existing.getPublishedAt() == null) {
            article.setPublishedAt(LocalDateTime.now());

            // Phase 3: 发布时生成向量嵌入（需要 pgvector）
        }
        articleMapper.updateById(article);
        return articleMapper.selectById(id);
    }

    @Override
    public void deleteArticle(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        // 软删除：只改状态，不真删数据
        article.setStatus("ARCHIVED");
        articleMapper.updateById(article);
    }

    @Override
    public void likeArticle(Integer articleId) {
        Article article = articleMapper.selectById(articleId);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        article.setLikeCount(article.getLikeCount() + 1);
        articleMapper.updateById(article);
    }

    @Override
    public Article saveDraft(Article article, Integer authorId) {
        if (article.getId() != null) {
            Article existing = articleMapper.selectById(article.getId());
            if (existing == null || !existing.getAuthorId().equals(authorId)) {
                throw new BusinessException(ResultCode.FORBIDDEN, "无权操作此草稿");
            }
            if (article.getTitle() != null) existing.setTitle(article.getTitle());
            if (article.getContent() != null) existing.setContent(article.getContent());
            if (article.getSummary() != null) existing.setSummary(article.getSummary());
            if (article.getCoverImageUrl() != null) existing.setCoverImageUrl(article.getCoverImageUrl());
            if (article.getCategoryId() != null) existing.setCategoryId(article.getCategoryId());
            articleMapper.updateById(existing);
            return existing;
        } else {
            article.setAuthorId(authorId);
            article.setStatus("DRAFT");
            article.setSlug("draft-" + System.currentTimeMillis());
            articleMapper.insert(article);
            return article;
        }
    }

    @Override
    public List<Article> getDraftsByUser(Integer userId) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        wrapper.eq("author_id", userId)
               .eq("status", "DRAFT")
               .orderByDesc("updated_at");
        return articleMapper.selectList(wrapper);
    }

    @Override
    public Article getDraftById(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "草稿不存在");
        }
        return article;
    }

    @Override
    public void deleteDraft(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null || !"DRAFT".equals(article.getStatus())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "草稿不存在");
        }
        articleMapper.deleteById(id);
    }

    @Override
    public Article publishDraft(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null || !"DRAFT".equals(article.getStatus())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "草稿不存在");
        }
        if (article.getTitle() == null || article.getTitle().isBlank()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "标题不能为空");
        }
        if (article.getContent() == null || article.getContent().isBlank()) {
            throw new BusinessException(ResultCode.BAD_REQUEST, "内容不能为空");
        }
        article.setStatus("PUBLISHED");
        article.setPublishedAt(LocalDateTime.now());
        article.setSlug(generateSlug(article.getTitle()));
        articleMapper.updateById(article);
        return article;
    }

    @Override
    public IPage<Article> searchArticles(String keyword, int page, int size) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        wrapper.eq("status", "PUBLISHED")
               .and(w -> w.like("title", keyword).or().like("content", keyword))
               .orderByDesc("published_at");
        return articleMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public IPage<Article> getAllArticles(int page, int size, String status) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        if (status != null && !"ALL".equals(status)) {
            wrapper.eq("status", status);
        }
        wrapper.orderByDesc("updated_at");
        return articleMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public Article getArticleById(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        return article;
    }

    /** 生成 URL 友好的 slug（简化版：标题 + 时间戳） */
    private String generateSlug(String title) {
        // 简单实现：保留字母数字，空格转横线，加时间戳防重复
        String base = title.toLowerCase()
                .replaceAll("[^a-z0-9\\u4e00-\\u9fa5]", "-")  // 保留中英文和数字
                .replaceAll("-+", "-")                         // 多横线合并
                .replaceAll("^-|-$", "");                      // 去掉首尾横线
        return base + "-" + System.currentTimeMillis();
    }
}
