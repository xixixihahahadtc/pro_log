package com.blogpro.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.blogpro.entity.Comment;

public interface CommentService {
    /** 分页获取文章的评论 */
    IPage<Comment> getCommentsByArticle(Integer articleId, int page, int size);
    /** 创建评论 */
    Comment createComment(Comment comment);
    /** 审核评论 */
    void reviewComment(Integer commentId, String status);
    /** 删除评论 */
    void deleteComment(Integer commentId);
    /** 管理员分页获取所有评论（可按状态筛选） */
    IPage<Comment> getAllComments(int page, int size, String status);
}
