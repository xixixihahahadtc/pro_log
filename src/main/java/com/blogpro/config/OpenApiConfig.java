package com.blogpro.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI 文档配置
 *
 * 启动项目后访问: http://localhost:8080/swagger-ui.html
 * 就能看到所有接口的文档页面
 */
@Configuration  // 告诉 Spring: 这是一个配置类
public class OpenApiConfig {

    @Bean  // 告诉 Spring: 这个方法返回的对象交给 Spring 管理
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("AI Blog Pro API")        // 文档标题
                        .version("1.0.0")                // 版本号
                        .description("企业级 AI 博客平台 API 文档"));  // 描述
    }
}
