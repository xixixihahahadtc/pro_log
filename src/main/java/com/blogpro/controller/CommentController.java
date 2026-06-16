package com.blogpro.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.blogpro.annotation.RequireRole;
import com.blogpro.entity.Comment;
import com.blogpro.model.dto.request.CommentCreateRequest;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    /** 获取文章评论列表（公开） */
    @GetMapping("/articles/{articleId}/comments")
    public ApiResponse<IPage<Comment>> list(@PathVariable Integer articleId,
                                             @RequestParam(defaultValue = "1") int page,
                                             @RequestParam(defaultValue = "10") int size) {
        IPage<Comment> comments = commentService.getCommentsByArticle(articleId, page, size);
        return ApiResponse.success(comments);
    }

    /** 创建评论（支持匿名） */
    @PostMapping("/articles/{articleId}/comments")
    public ApiResponse<Comment> create(@PathVariable Integer articleId,
                                       @Valid @RequestBody CommentCreateRequest request) {
        Integer userId = null;
        try {
            Object principal = SecurityContextHolder.getContext()
                    .getAuthentication().getPrincipal();
            if (principal instanceof Integer) userId = (Integer) principal;
        } catch (Exception ignored) {}

        Comment comment = new Comment();
        comment.setArticleId(articleId);
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setParentId(request.getParentId());

        Comment created = commentService.createComment(comment);
        return ApiResponse.success(created);
    }

    /** 管理员评论列表（分页，按状态筛选） */
    @GetMapping("/admin/comments")
    @RequireRole("ADMIN")
    public ApiResponse<IPage<Comment>> adminList(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "ALL") String status) {
        return ApiResponse.success(commentService.getAllComments(page, size, status));
    }

    /** 审核评论（管理员） */
    @PutMapping("/comments/{id}/status")
    @RequireRole("ADMIN")
    public ApiResponse<Void> review(@PathVariable Integer id,
                                     @RequestParam String status) {
        commentService.reviewComment(id, status);
        return ApiResponse.success(null);
    }

    /** 删除评论（管理员） */
    @DeleteMapping("/comments/{id}")
    @RequireRole("ADMIN")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        commentService.deleteComment(id);
        return ApiResponse.success(null);
    }
}
