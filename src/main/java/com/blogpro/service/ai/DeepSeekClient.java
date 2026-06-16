package com.blogpro.service.ai;

import com.blogpro.exception.BusinessException;
import com.blogpro.model.enums.ResultCode;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * DeepSeek API 统一客户端
 * 封装 RestClient + JSON 解析，所有 AI 服务统一依赖此类
 */
@Slf4j
@Component
public class DeepSeekClient {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String baseUrl;
    private final String apiKey;

    public DeepSeekClient(
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.base-url}") String baseUrl) {
        this.objectMapper = new ObjectMapper();
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);  // 10 seconds
        factory.setReadTimeout(60000);     // 60 seconds
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .defaultHeader("Content-Type", "application/json")
                .requestFactory(factory)
                .build();
    }

    /** 使用默认 temperature (0.7) 调用 */
    public String call(String systemPrompt, String userMessage) {
        return call(systemPrompt, userMessage, 0.7);
    }

    /** 使用自定义 temperature 调用 */
    public String call(String systemPrompt, String userMessage, double temperature) {
        try {
            Map<String, Object> body = Map.of(
                    "model", "deepseek-chat",
                    "messages", List.of(
                            Map.of("role", "system", "content", systemPrompt),
                            Map.of("role", "user", "content", userMessage)
                    ),
                    "temperature", temperature
            );

            String json = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(json);

            // Check for API error response
            if (root.has("error")) {
                String errorMsg = root.path("error").path("message").asText("Unknown API error");
                log.error("DeepSeek API 返回错误: {}", errorMsg);
                throw new BusinessException(ResultCode.INTERNAL_ERROR,
                        "AI 服务错误: " + errorMsg);
            }

            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.size() == 0) {
                log.error("DeepSeek API 返回空 choices: {}", json);
                throw new BusinessException(ResultCode.INTERNAL_ERROR,
                        "AI 服务返回空结果");
            }

            return choices.get(0).path("message").path("content").asText();

        } catch (Exception e) {
            log.error("DeepSeek API 调用失败", e);
            throw new BusinessException(ResultCode.INTERNAL_ERROR,
                    "AI 服务调用失败: " + e.getMessage());
        }
    }

    /**
     * 流式调用 DeepSeek API — 通过 consumer 回调逐段推送文本
     * 使用 Java HttpClient 的 BodyHandlers.ofLines() 做真正的异步流式读取
     *
     * @param messages    完整的消息列表 [{role, content}, ...]
     * @param temperature 温度
     * @param onChunk     每收到一段文本时回调
     * @throws Exception  调用失败时抛出
     */
    public void streamToConsumer(List<Map<String, String>> messages, double temperature,
                                  java.util.function.Consumer<String> onChunk) throws Exception {
        Map<String, Object> bodyMap = Map.of(
                "model", "deepseek-chat",
                "messages", messages,
                "temperature", temperature,
                "stream", true
        );
        String bodyJson = objectMapper.writeValueAsString(bodyMap);

        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(java.net.URI.create(baseUrl + "/chat/completions"))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .header("Accept", "text/event-stream")
                .timeout(java.time.Duration.ofSeconds(120))
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                .build();

        HttpResponse<java.io.InputStream> response = httpClient.send(request,
                HttpResponse.BodyHandlers.ofInputStream());

        if (response.statusCode() != 200) {
            String errorBody = new String(response.body().readAllBytes());
            log.error("DeepSeek API 返回 {}: {}", response.statusCode(), errorBody);
            throw new BusinessException(ResultCode.INTERNAL_ERROR,
                    "AI 服务返回错误 " + response.statusCode());
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ")) {
                    String data = line.substring(6).trim();
                    if ("[DONE]".equals(data)) {
                        return;
                    }
                    if (data.isEmpty()) continue;
                    try {
                        JsonNode node = objectMapper.readTree(data);
                        JsonNode choices = node.path("choices");
                        if (choices.isArray() && choices.size() > 0) {
                            JsonNode delta = choices.get(0).path("delta");
                            String content = delta.path("content").asText(null);
                            if (content != null && !content.isEmpty()) {
                                onChunk.accept(content);
                            }
                        }
                    } catch (Exception ignored) {
                        // skip malformed SSE lines
                    }
                }
            }
        }
    }
}
