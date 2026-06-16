package com.blogpro.service.impl;

import com.blogpro.entity.Tag;
import com.blogpro.mapper.TagMapper;
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
        return tagMapper.selectList(null);  // null = 无过滤条件，查全部
    }

    @Override
    public Tag createTag(Tag tag) {
        tagMapper.insert(tag);
        return tag;
    }

    @Override
    public void deleteTag(Integer id) {
        tagMapper.deleteById(id);
    }
}
