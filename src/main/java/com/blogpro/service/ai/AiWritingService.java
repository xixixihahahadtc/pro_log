package com.blogpro.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * AI 写作助手 — 帮助作者写文章
 */
@Service
@RequiredArgsConstructor
public class AiWritingService {

    private final DeepSeekClient deepSeekClient;

    public String generateOutline(String topic) {
        return deepSeekClient.call(
                "你是专业博客写作顾问。为主题生成结构化大纲，用 ## 和 ### 表示层级，每节一句话说明。只输出大纲。",
                "为主题「" + topic + "」生成博客大纲");
    }

    public String expand(String bulletPoints, String style) {
        return deepSeekClient.call(
                "将要点扩展成流畅段落。写作风格：" + style + "。保持原意，不添加虚假信息。",
                "扩展以下要点：\n" + bulletPoints);
    }

    public String improve(String text) {
        return deepSeekClient.call(
                "你是文字编辑。润色以下文本：修正错别字、改善流畅度、保持原文风格。只输出润色后文本。",
                text);
    }

    public String generateTitles(String content) {
        return deepSeekClient.call(
                "根据文章内容生成5个SEO友好标题。每行一个，用数字序号开头。50-60字，包含关键词。",
                "文章内容：\n" + content);
    }
}
