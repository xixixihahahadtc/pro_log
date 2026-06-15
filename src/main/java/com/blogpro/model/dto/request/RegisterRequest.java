package com.blogpro.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 注册请求 DTO
 * @NotBlank: 字符串不能为 null 且去掉空格后不能为空
 * @Size: 字符串长度限制
 * message: 校验失败时返回的提示信息
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "用户名不能为空")
    @Size(min = 3, max = 50, message = "用户名长度需在3-50之间")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 100, message = "密码长度需在6-100之间")
    private String password;

    @Size(max = 50, message = "昵称长度不能超过50")
    private String nickname;
}
