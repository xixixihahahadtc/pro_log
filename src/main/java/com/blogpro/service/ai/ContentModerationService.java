package com.blogpro.service.ai;

import com.blogpro.entity.Comment;
import com.blogpro.mapper.CommentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 内容审核 AI Agent 服务
 *
 * AI Agent 的核心模式：
 * 1. AI 读取信息（评论内容）
 * 2. AI 做判断（是否违规）
 * 3. AI 执行操作（通过/拒绝）
 */
@Service
@RequiredArgsConstructor
public class ContentModerationService {

    private final DeepSeekClient deepSeekClient;
    private final CommentMapper commentMapper;

    private static final String SYSTEM_PROMPT = """
            你是一个内容审核员。请审核以下评论。
            规则：
            - 正常讨论、提问、感谢 → 回复: APPROVED
            - 广告、色情、赌博、脏话、人身攻击 → 回复: REJECTED
            - 无法判断 → 回复: PENDING

            只能回复一个词: APPROVED、REJECTED 或 PENDING，不要回复其他内容。
            """;

    /**
     * AI Agent 审核一条评论
     */
    public String moderateComment(Integer commentId) {
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            return "评论 ID " + commentId + " 不存在";
        }

        String verdict = deepSeekClient.call(SYSTEM_PROMPT, "请审核这条评论：「" + comment.getContent() + "」")
                .trim()
                .toUpperCase();

        String finalStatus;
        if (verdict.contains("APPROVED")) {
            finalStatus = "APPROVED";
        } else if (verdict.contains("REJECTED")) {
            finalStatus = "REJECTED";
        } else {
            finalStatus = "PENDING";
        }

        comment.setStatus(finalStatus);
        commentMapper.updateById(comment);

        return "评论 " + commentId + " 审核完成: " + finalStatus +
               "（AI判断: " + verdict + "）";
    }
}
