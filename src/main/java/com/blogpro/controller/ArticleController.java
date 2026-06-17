package com.blogpro.controller;

import com.blogpro.annotation.RequireRole;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.blogpro.entity.Article;
import com.blogpro.model.dto.request.ArticleCreateRequest;
import com.blogpro.model.dto.request.DraftSaveRequest;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.model.dto.response.DashboardStatsResponse;
import com.blogpro.model.dto.response.DraftResponse;
import com.blogpro.model.enums.ResultCode;
import java.util.List;
import java.util.stream.Collectors;
import com.blogpro.service.ArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/articles")
@RequiredArgsConstructor
public class ArticleController {

    private final ArticleService articleService;

    // ===== 公开接口 =====

    /** 文章列表（分页，可按分类过滤） */
    @GetMapping
    public ApiResponse<IPage<Article>> list(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer tagId,
            @RequestParam(required = false) Integer authorId) {
        IPage<Article> result = articleService.getPublishedArticles(page, size, categoryId, tagId, authorId);
        return ApiResponse.success(result);
    }

    /** 文章详情（按 slug） */
    @GetMapping("/{slug}")
    public ApiResponse<Article> detail(@PathVariable String slug) {
        Article article = articleService.getArticleBySlug(slug);
        return ApiResponse.success(article);
    }

    // ===== 需认证接口 =====

    /** 创建文章 */
    @PostMapping
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Article> create(@Valid @RequestBody ArticleCreateRequest request) {
        // 从 JWT 安全上下文中取出当前用户 ID
        Integer userId = (Integer) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setCoverImageUrl(request.getCoverImageUrl());
        article.setCategoryId(request.getCategoryId());
        // tagIds 暂时不处理，后续优化

        Article created = articleService.createArticle(article, userId);
        return ApiResponse.success(created);
    }

    /** 更新文章 */
    @PutMapping("/{id}")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Article> update(@PathVariable Integer id,
                                       @Valid @RequestBody ArticleCreateRequest request) {
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setCoverImageUrl(request.getCoverImageUrl());
        article.setCategoryId(request.getCategoryId());

        Article updated = articleService.updateArticle(id, article);
        return ApiResponse.success(updated);
    }

    /** 删除文章（软删除） */
    @DeleteMapping("/{id}")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        articleService.deleteArticle(id);
        return ApiResponse.success(null);
    }

    /** 获取当前用户是否已点赞 */
    @GetMapping("/{id}/liked")
    public ApiResponse<Boolean> isLiked(@PathVariable Integer id) {
        Integer userId = null;
        try {
            Object principal = SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            if (principal instanceof Integer) userId = (Integer) principal;
        } catch (Exception ignored) {}
        if (userId == null) return ApiResponse.success(false);
        boolean liked = articleService.isLikedByUser(id, userId);
        return ApiResponse.success(liked);
    }

    /** 点赞/取消点赞（toggle） */
    @PostMapping("/{id}/like")
    public ApiResponse<Boolean> like(@PathVariable Integer id) {
        Integer userId = null;
        try {
            Object principal = SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            if (principal instanceof Integer) userId = (Integer) principal;
        } catch (Exception ignored) {}
        if (userId == null) {
            return ApiResponse.error(ResultCode.UNAUTHORIZED, "请先登录");
        }
        boolean liked = articleService.toggleLike(id, userId);
        return ApiResponse.success(liked);
    }

    // ===== 草稿接口 =====

    /** 保存草稿（新建或更新） */
    @PostMapping("/draft")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<DraftResponse> saveDraft(@RequestBody DraftSaveRequest request) {
        Integer userId = (Integer) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();

        Article article = new Article();
        article.setId(request.getId());
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setCoverImageUrl(request.getCoverImageUrl());
        article.setCategoryId(request.getCategoryId());

        Article saved = articleService.saveDraft(article, userId);
        return ApiResponse.success(toDraftResponse(saved));
    }

    /** 获取当前用户的草稿列表 */
    @GetMapping("/drafts")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<List<DraftResponse>> listDrafts() {
        Integer userId = (Integer) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        List<Article> drafts = articleService.getDraftsByUser(userId);
        List<DraftResponse> result = drafts.stream()
                .map(this::toDraftResponse)
                .collect(Collectors.toList());
        return ApiResponse.success(result);
    }

    /** 获取单篇草稿 */
    @GetMapping("/draft/{id}")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<DraftResponse> getDraft(@PathVariable Integer id) {
        Article article = articleService.getDraftById(id);
        return ApiResponse.success(toDraftResponse(article));
    }

    /** 删除草稿 */
    @DeleteMapping("/draft/{id}")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Void> deleteDraft(@PathVariable Integer id) {
        articleService.deleteDraft(id);
        return ApiResponse.success(null);
    }

    /** 发布草稿 */
    @PutMapping("/{id}/publish")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Article> publishDraft(@PathVariable Integer id) {
        Article published = articleService.publishDraft(id);
        return ApiResponse.success(published);
    }

    /** 搜索文章（标题+内容关键词） */
    @GetMapping("/search")
    public ApiResponse<IPage<Article>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        IPage<Article> result = articleService.searchArticles(q, page, size);
        return ApiResponse.success(result);
    }

    // ===== 管理员接口 =====

    /** 管理员文章列表（所有状态，可按 status 筛选） */
    @GetMapping("/admin")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<IPage<Article>> adminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "ALL") String status) {
        IPage<Article> result = articleService.getAllArticles(page, size, status);
        return ApiResponse.success(result);
    }

    /** 管理员按 ID 获取文章详情 */
    @GetMapping("/admin/{id}")
    @RequireRole({"USER", "ADMIN"})
    public ApiResponse<Article> adminDetail(@PathVariable Integer id) {
        Article article = articleService.getArticleById(id);
        return ApiResponse.success(article);
    }

    /** 管理员仪表盘统计 */
    @GetMapping("/admin/stats")
    @RequireRole("ADMIN")
    public ApiResponse<DashboardStatsResponse> stats() {
        return ApiResponse.success(articleService.getStats());
    }

    private DraftResponse toDraftResponse(Article article) {
        DraftResponse res = new DraftResponse();
        res.setId(article.getId());
        res.setTitle(article.getTitle());
        res.setContent(article.getContent());
        res.setSummary(article.getSummary());
        res.setCoverImageUrl(article.getCoverImageUrl());
        res.setCategoryId(article.getCategoryId());
        res.setStatus(article.getStatus());
        res.setCreatedAt(article.getCreatedAt());
        res.setUpdatedAt(article.getUpdatedAt());
        return res;
    }
}
