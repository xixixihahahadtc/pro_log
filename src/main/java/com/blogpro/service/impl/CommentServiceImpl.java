package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blogpro.entity.Article;
import com.blogpro.entity.Comment;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.ArticleMapper;
import com.blogpro.mapper.CommentMapper;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final ArticleMapper articleMapper;

    @Override
    public IPage<Comment> getCommentsByArticle(Integer articleId, int page, int size) {
        QueryWrapper<Comment> wrapper = new QueryWrapper<>();
        wrapper.eq("article_id", articleId)
               .eq("status", "APPROVED")          // 只显示已审核通过的
               .isNull("parent_id")               // 只查顶级评论，回复单独查
               .orderByDesc("created_at");
        return commentMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public Comment createComment(Comment comment) {
        comment.setStatus("PENDING"); // 新评论默认待审核
        commentMapper.insert(comment);

        // 同步更新文章评论计数
        Article article = articleMapper.selectById(comment.getArticleId());
        if (article != null) {
            int currentCount = article.getCommentCount() == null ? 0 : article.getCommentCount();
            article.setCommentCount(currentCount + 1);
            articleMapper.updateById(article);
        }

        return comment;
    }

    @Override
    public void reviewComment(Integer commentId, String status) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "评论不存在");
        }
        comment.setStatus(status);
        commentMapper.updateById(comment);
    }

    @Override
    public IPage<Comment> getAllComments(int page, int size, String status) {
        QueryWrapper<Comment> wrapper = new QueryWrapper<>();
        if (status != null && !"ALL".equals(status)) {
            wrapper.eq("status", status);
        }
        wrapper.orderByDesc("created_at");
        return commentMapper.selectPage(new Page<>(page, size), wrapper);
    }

    @Override
    public void deleteComment(Integer commentId) {
        commentMapper.deleteById(commentId);
    }
}
