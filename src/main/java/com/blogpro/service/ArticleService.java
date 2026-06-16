package com.blogpro.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.blogpro.entity.Article;

import java.util.List;

public interface ArticleService {
    /** 分页获取已发布的文章列表 */
    IPage<Article> getPublishedArticles(int page, int size, Integer categoryId, Integer tagId);
    /** 根据 slug 获取文章详情（并增加浏览次数） */
    Article getArticleBySlug(String slug);
    /** 创建文章 */
    Article createArticle(Article article, Integer authorId);
    /** 更新文章 */
    Article updateArticle(Integer id, Article article);
    /** 删除文章（软删除：改为 ARCHIVED 状态） */
    void deleteArticle(Integer id);
    /** 点赞 */
    void likeArticle(Integer articleId);

    /** 保存草稿（新建或更新） */
    Article saveDraft(Article article, Integer authorId);

    /** 获取用户的草稿列表 */
    List<Article> getDraftsByUser(Integer userId);

    /** 获取单篇草稿 */
    Article getDraftById(Integer id);

    /** 删除草稿 */
    void deleteDraft(Integer id);

    /** 发布草稿 */
    Article publishDraft(Integer id);

    /** 搜索文章（标题+内容模糊匹配） */
    IPage<Article> searchArticles(String keyword, int page, int size);

    /** 管理员分页获取所有文章（可按状态筛选） */
    IPage<Article> getAllArticles(int page, int size, String status);

    /** 管理员按 ID 获取文章详情（不受状态限制） */
    Article getArticleById(Integer id);
}
