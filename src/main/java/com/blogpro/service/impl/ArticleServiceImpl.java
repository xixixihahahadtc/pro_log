package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blogpro.entity.Article;
import com.blogpro.entity.User;
import com.blogpro.entity.UserLike;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.ArticleMapper;
import com.blogpro.mapper.CommentMapper;
import com.blogpro.mapper.UserLikeMapper;
import com.blogpro.mapper.UserMapper;
import com.blogpro.model.dto.response.DashboardStatsResponse;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.ArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArticleServiceImpl implements ArticleService {

    private final ArticleMapper articleMapper;
    private final UserLikeMapper userLikeMapper;
    private final CommentMapper commentMapper;
    private final UserMapper userMapper;

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

        IPage<Article> result = articleMapper.selectPage(new Page<>(page, size), wrapper);
        fillAuthorNames(result.getRecords());
        return result;
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

        // 原子更新浏览次数，避免并发丢失
        article.setViewCount(article.getViewCount() + 1);
        com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<Article> uw =
                new com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper<>();
        uw.eq("id", article.getId()).setSql("view_count = view_count + 1");
        articleMapper.update(uw);

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
    public boolean isLikedByUser(Integer articleId, Integer userId) {
        QueryWrapper<UserLike> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("article_id", articleId);
        return userLikeMapper.selectCount(wrapper) > 0;
    }

    @Override
    @Transactional
    public boolean toggleLike(Integer articleId, Integer userId) {
        Article article = articleMapper.selectById(articleId);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        // 检查是否已点赞
        QueryWrapper<UserLike> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId).eq("article_id", articleId);
        if (userLikeMapper.selectCount(wrapper) > 0) {
            // 已点赞 → 取消
            userLikeMapper.delete(wrapper);
            article.setLikeCount(Math.max(0, article.getLikeCount() - 1));
            articleMapper.updateById(article);
            return false;
        } else {
            // 未点赞 → 点赞
            UserLike like = new UserLike();
            like.setUserId(userId);
            like.setArticleId(articleId);
            userLikeMapper.insert(like);
            article.setLikeCount(article.getLikeCount() + 1);
            articleMapper.updateById(article);
            return true;
        }
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
        IPage<Article> result = articleMapper.selectPage(new Page<>(page, size), wrapper);
        fillAuthorNames(result.getRecords());
        return result;
    }

    @Override
    public IPage<Article> getAllArticles(int page, int size, String status) {
        QueryWrapper<Article> wrapper = new QueryWrapper<>();
        if (status != null && !"ALL".equals(status)) {
            wrapper.eq("status", status);
        }
        wrapper.orderByDesc("updated_at");
        IPage<Article> result = articleMapper.selectPage(new Page<>(page, size), wrapper);
        fillAuthorNames(result.getRecords());
        return result;
    }

    @Override
    public Article getArticleById(Integer id) {
        Article article = articleMapper.selectById(id);
        if (article == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "文章不存在");
        }
        return article;
    }

    @Override
    public DashboardStatsResponse getStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();
        stats.setTotalArticles(articleMapper.selectCount(new QueryWrapper<>()));
        stats.setTotalComments(commentMapper.selectCount(new QueryWrapper<>()));
        stats.setTotalUsers(userMapper.selectCount(new QueryWrapper<>()));

        // 总浏览量
        long totalViews = articleMapper.selectList(new QueryWrapper<>())
                .stream().mapToLong(a -> a.getViewCount() == null ? 0 : a.getViewCount()).sum();
        stats.setTotalViews(totalViews);

        // 最近 5 篇已发布文章
        QueryWrapper<Article> recentWrapper = new QueryWrapper<>();
        recentWrapper.eq("status", "PUBLISHED")
                .orderByDesc("published_at")
                .last("LIMIT 5");
        List<Article> recentArticles = articleMapper.selectList(recentWrapper);
        fillAuthorNames(recentArticles);
        stats.setRecentArticles(recentArticles);

        return stats;
    }

    /** 批量填充文章作者昵称 */
    private void fillAuthorNames(List<Article> articles) {
        if (articles == null || articles.isEmpty()) return;
        Set<Integer> authorIds = articles.stream()
                .map(Article::getAuthorId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (authorIds.isEmpty()) return;
        List<User> users = userMapper.selectBatchIds(authorIds);
        Map<Integer, String> nameMap = users.stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
        for (Article a : articles) {
            if (a.getAuthorId() != null) a.setAuthorName(nameMap.getOrDefault(a.getAuthorId(), ""));
        }
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
