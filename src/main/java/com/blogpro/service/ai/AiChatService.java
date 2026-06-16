package com.blogpro.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.function.Consumer;

/**
 * AI 聊天服务 — 为博客读者提供智能对话
 */
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final DeepSeekClient deepSeekClient;

    private static final String SYSTEM_PROMPT =
            "你是\"AI Blog Pro\"的智能助手，专为博客读者服务。回答应该友好、简洁、准确。如果不确定的答案，坦诚说\"我不确定\"。用中文回答。";

    public String chat(String message) {
        return deepSeekClient.call(SYSTEM_PROMPT, message);
    }

    public record ChatMessage(String role, String content) {}

    /** 流式聊天 — 通过 consumer 回调逐段推送文本 */
    public void chatStream(List<ChatMessage> history, Consumer<String> onChunk) throws Exception {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        int start = Math.max(0, history.size() - 20);
        for (ChatMessage msg : history.subList(start, history.size())) {
            messages.add(Map.of("role", msg.role(), "content", msg.content()));
        }

        deepSeekClient.streamToConsumer(messages, 0.7, onChunk);
    }
}
