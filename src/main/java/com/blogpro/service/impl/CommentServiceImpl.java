package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.blogpro.entity.Article;
import com.blogpro.entity.Comment;
import com.blogpro.entity.User;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.ArticleMapper;
import com.blogpro.mapper.CommentMapper;
import com.blogpro.mapper.UserMapper;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentMapper commentMapper;
    private final ArticleMapper articleMapper;
    private final UserMapper userMapper;

    @Override
    public IPage<Comment> getCommentsByArticle(Integer articleId, int page, int size) {
        QueryWrapper<Comment> wrapper = new QueryWrapper<>();
        wrapper.eq("article_id", articleId)
               .eq("status", "APPROVED")          // 只显示已审核通过的
               .isNull("parent_id")               // 只查顶级评论，回复单独查
               .orderByDesc("created_at");
        IPage<Comment> result = commentMapper.selectPage(new Page<>(page, size), wrapper);
        fillUsernames(result.getRecords());
        return result;
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
        IPage<Comment> result = commentMapper.selectPage(new Page<>(page, size), wrapper);
        fillUsernames(result.getRecords());
        return result;
    }

    @Override
    public void deleteComment(Integer commentId) {
        commentMapper.deleteById(commentId);
    }

    /** 批量填充评论者昵称（匿名用户跳过） */
    private void fillUsernames(List<Comment> comments) {
        if (comments == null || comments.isEmpty()) return;
        Set<Integer> userIds = comments.stream()
                .map(Comment::getUserId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (userIds.isEmpty()) return;
        List<User> users = userMapper.selectBatchIds(userIds);
        Map<Integer, String> nameMap = users.stream()
                .collect(Collectors.toMap(User::getId, u -> u.getNickname() != null ? u.getNickname() : u.getUsername()));
        for (Comment c : comments) {
            if (c.getUserId() != null) c.setUsername(nameMap.getOrDefault(c.getUserId(), "匿名"));
        }
    }
}
