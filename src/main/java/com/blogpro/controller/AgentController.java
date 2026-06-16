package com.blogpro.controller;

import com.blogpro.annotation.RequireRole;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.service.ai.ContentModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * AI Agent 控制器
 */
@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final ContentModerationService moderationService;

    /**
     * AI Agent 审核评论
     * AI 会自己查评论内容 → 判断是否违规 → 修改状态
     */
    @PostMapping("/moderate/{commentId}")
    @RequireRole("ADMIN")
    public ApiResponse<String> moderateComment(@PathVariable Integer commentId) {
        String result = moderationService.moderateComment(commentId);
        return ApiResponse.success(result);
    }
}
