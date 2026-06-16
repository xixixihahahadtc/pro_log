package com.blogpro.service;

import com.blogpro.entity.Tag;

import java.util.List;

public interface TagService {
    /** 获取所有标签 */
    List<Tag> getAllTags();
    /** 创建标签 */
    Tag createTag(Tag tag);
    /** 删除标签 */
    void deleteTag(Integer id);
}
