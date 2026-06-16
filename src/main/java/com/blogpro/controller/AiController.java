package com.blogpro.controller;

import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.service.ai.AiChatService;
import com.blogpro.service.ai.AiLabService;
import com.blogpro.service.ai.AiWritingService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * AI 控制器 — 所有 AI 相关接口
 */
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiChatService aiChatService;
    private final AiWritingService aiWritingService;
    private final AiLabService aiLabService;

    // ===== AI 聊天 =====

    /** 简单问答 */
    @PostMapping("/chat")
    public ApiResponse<String> chat(@RequestBody Map<String, String> body) {
        String message = body.get("message");
        String reply = aiChatService.chat(message);
        return ApiResponse.success(reply);
    }

    /** 流式问答 — 纯文本逐段输出，打字机效果，支持多轮对话 */
    @PostMapping("/chat/stream")
    public void chatStream(@RequestBody Map<String, Object> body,
                           HttpServletResponse response) throws Exception {
        response.setContentType("text/plain;charset=UTF-8");
        response.setHeader("X-Content-Type-Options", "nosniff");

        @SuppressWarnings("unchecked")
        List<Map<String, String>> rawMessages = (List<Map<String, String>>) body.get("messages");

        List<AiChatService.ChatMessage> history = new java.util.ArrayList<>();
        if (rawMessages != null) {
            for (Map<String, String> msg : rawMessages) {
                history.add(new AiChatService.ChatMessage(
                        msg.get("role"), msg.get("content")));
            }
        }

        OutputStream out = response.getOutputStream();
        try {
            aiChatService.chatStream(history, chunk -> {
                try {
                    out.write(chunk.getBytes(StandardCharsets.UTF_8));
                    out.flush();
                } catch (Exception ignored) {}
            });
        } catch (Exception e) {
            out.write(("AI 错误: " + e.getMessage()).getBytes(StandardCharsets.UTF_8));
        }
        out.flush();
    }

    // ===== AI 写作助手 =====

    /** 生成文章大纲 */
    @PostMapping("/writing/outline")
    public ApiResponse<String> generateOutline(@RequestBody Map<String, String> body) {
        String topic = body.get("topic");
        String outline = aiWritingService.generateOutline(topic);
        return ApiResponse.success(outline);
    }

    /** 要点扩展 */
    @PostMapping("/writing/expand")
    public ApiResponse<String> expand(@RequestBody Map<String, String> body) {
        String points = body.get("points");
        String style = body.getOrDefault("style", "技术教程");
        String expanded = aiWritingService.expand(points, style);
        return ApiResponse.success(expanded);
    }

    /** 改写润色 */
    @PostMapping("/writing/improve")
    public ApiResponse<String> improve(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        String improved = aiWritingService.improve(text);
        return ApiResponse.success(improved);
    }

    /** 标题建议 */
    @PostMapping("/writing/titles")
    public ApiResponse<String> suggestTitles(@RequestBody Map<String, String> body) {
        String content = body.get("content");
        String titles = aiWritingService.generateTitles(content);
        return ApiResponse.success(titles);
    }

    // ===== Prompt 实验台 =====

    /** 对比 3 种 Prompt 的效果 */
    @PostMapping("/lab/compare")
    public ApiResponse<Map<String, String>> comparePrompts(@RequestBody Map<String, String> body) {
        String input = body.get("input");
        Map<String, String> results = aiLabService.comparePrompts(input);
        return ApiResponse.success(results);
    }

    /** 测试不同 temperature */
    @PostMapping("/lab/temperature")
    public ApiResponse<Map<String, String>> testTemperature(@RequestBody Map<String, Object> body) {
        String input = (String) body.get("input");
        double temp = ((Number) body.getOrDefault("temperature", 0.7)).doubleValue();
        Map<String, String> results = aiLabService.compareTemperature(input, temp);
        return ApiResponse.success(results);
    }
}
