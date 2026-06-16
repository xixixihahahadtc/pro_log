package com.blogpro.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_likes")
public class UserLike {
    private Integer userId;
    private Integer articleId;
    private LocalDateTime createdAt;
}
