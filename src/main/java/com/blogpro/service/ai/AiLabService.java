package com.blogpro.service.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Prompt 实验台 — 教学用途
 * 对比不同 Prompt 对同一输入的 AI 输出差异
 */
@Service
@RequiredArgsConstructor
public class AiLabService {

    private final DeepSeekClient deepSeekClient;

    /**
     * 对同一输入使用 3 种不同的 System Prompt，比较结果
     * 返回 Map<提示词名称, AI输出>
     */
    public Map<String, String> comparePrompts(String input) {
        Map<String, String> results = new LinkedHashMap<>();

        results.put("简洁模式", deepSeekClient.call("用一句话回答。", input));
        results.put("详细模式", deepSeekClient.call("请详细解释，给出具体例子，分为3段以上回答。", input));
        results.put("类比模式", deepSeekClient.call("用生活化的类比和比喻来解释，让小学生也能听懂。", input));

        return results;
    }

    /**
     * 用不同 temperature 测试同一输入
     */
    public Map<String, String> compareTemperature(String input, double temp) {
        Map<String, String> results = new LinkedHashMap<>();
        String response = deepSeekClient.call("请用一段话回答以下问题。", input, temp);
        results.put("temperature=".concat(String.format("%.2f", temp)), response);
        return results;
    }
}
