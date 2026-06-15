package com.blogpro.exception;

import com.blogpro.model.enums.ResultCode;
import lombok.Getter;

/**
 * 业务异常 — 所有预期的业务错误（如用户名已存在、密码错误）都抛这个
 * 由 GlobalExceptionHandler 统一捕获并转成 ApiResponse
 */
@Getter
public class BusinessException extends RuntimeException {
    private final ResultCode resultCode;

    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.resultCode = resultCode;
    }

    public BusinessException(ResultCode resultCode, String customMessage) {
        super(customMessage);
        this.resultCode = resultCode;
    }
}
