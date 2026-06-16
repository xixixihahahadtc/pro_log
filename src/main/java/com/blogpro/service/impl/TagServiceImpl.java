package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.blogpro.entity.Tag;
import com.blogpro.exception.BusinessException;
import com.blogpro.mapper.TagMapper;
import com.blogpro.model.enums.ResultCode;
import com.blogpro.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagServiceImpl implements TagService {

    private final TagMapper tagMapper;

    @Override
    public List<Tag> getAllTags() {
        return tagMapper.selectList(new QueryWrapper<>());
    }

    @Override
    public Tag createTag(Tag tag) {
        tagMapper.insert(tag);
        return tag;
    }

    @Override
    public Tag updateTag(Integer id, Tag tag) {
        Tag existing = tagMapper.selectById(id);
        if (existing == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "标签不存在");
        }
        existing.setName(tag.getName());
        existing.setSlug(tag.getSlug());
        tagMapper.updateById(existing);
        return existing;
    }

    @Override
    public void deleteTag(Integer id) {
        tagMapper.deleteById(id);
    }
}
