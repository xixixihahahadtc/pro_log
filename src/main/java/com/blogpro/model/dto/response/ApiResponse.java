package com.blogpro.model.dto.response;

import com.blogpro.model.enums.ResultCode;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 统一 API 响应格式
 * { "code": 200, "message": "操作成功", "data": {...}, "timestamp": "..." }
 *
 * @param <T> data 字段的类型，如 ApiResponse<User> 表示 data 是 User 对象
 */
@Data
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    /** 成功响应（带数据） */
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.code = ResultCode.SUCCESS.getCode();
        response.message = ResultCode.SUCCESS.getMessage();
        response.data = data;
        response.timestamp = LocalDateTime.now();
        return response;
    }

    /** 失败响应（使用默认消息） */
    public static <T> ApiResponse<T> error(ResultCode resultCode) {
        ApiResponse<T> response = new ApiResponse<>();
        response.code = resultCode.getCode();
        response.message = resultCode.getMessage();
        response.timestamp = LocalDateTime.now();
        return response;
    }

    /** 失败响应（自定义消息，覆盖默认消息） */
    public static <T> ApiResponse<T> error(ResultCode resultCode, String customMessage) {
        ApiResponse<T> response = new ApiResponse<>();
        response.code = resultCode.getCode();
        response.message = customMessage;
        response.timestamp = LocalDateTime.now();
        return response;
    }
}
