package com.blogpro.controller;

import com.blogpro.annotation.RequireRole;
import com.blogpro.entity.Tag;
import com.blogpro.model.dto.response.ApiResponse;
import com.blogpro.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    /** 获取所有标签（公开） */
    @GetMapping
    public ApiResponse<List<Tag>> list() {
        List<Tag> tags = tagService.getAllTags();
        return ApiResponse.success(tags);
    }

    /** 创建标签（管理员） */
    @PostMapping
    @RequireRole("ADMIN")
    public ApiResponse<Tag> create(@RequestBody Tag tag) {
        Tag created = tagService.createTag(tag);
        return ApiResponse.success(created);
    }

    /** 删除标签（管理员） */
    @DeleteMapping("/{id}")
    @RequireRole("ADMIN")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        tagService.deleteTag(id);
        return ApiResponse.success(null);
    }
}
