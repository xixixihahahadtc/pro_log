package com.blogpro.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * 自动加载项目根目录 .env 文件到 Spring 环境变量
 *
 * 教知识：这就是"12-Factor App"推荐的做法——
 * 敏感配置放在 .env 文件里（不提交到 Git），
 * 应用启动时自动读入，用 ${变量名} 引用。
 */
@Component
public class DotenvConfig implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                        SpringApplication application) {
        Path envFile = Paths.get(".env");
        if (!Files.exists(envFile)) return;

        Map<String, Object> props = new HashMap<>();
        try {
            for (String line : Files.readAllLines(envFile)) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;
                int eq = line.indexOf('=');
                if (eq <= 0) continue;
                String key = line.substring(0, eq).trim();
                String value = line.substring(eq + 1).trim();
                props.put(key, value);
            }
        } catch (IOException ignored) {}

        environment.getPropertySources()
                .addFirst(new MapPropertySource("dotenv", props));
    }
}
