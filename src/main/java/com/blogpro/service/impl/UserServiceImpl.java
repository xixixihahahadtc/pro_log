package com.blogpro.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.blogpro.entity.User;
import com.blogpro.mapper.UserMapper;
import com.blogpro.service.UserService;
import com.blogpro.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    @Autowired
    private UserMapper userMapper;

    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Override
    public String register(User user){
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("username",user.getUsername());
        if(userMapper.selectOne(wrapper)!=null){
            return "用户名已存在";
        }
        user.setPassword(encoder.encode(user.getPassword()));
        userMapper.insert(user);
        return "注册成功";
    }
    @Override
    public String login(User user){
        User dbuser = userMapper.selectOne(new QueryWrapper<User>().eq("username",user.getUsername()));
        if(dbuser!=null&& encoder.matches(user.getPassword(),dbuser.getPassword())){
            return JwtUtils.creatToken(dbuser.getId(),dbuser.getUsername());
        }
        return null;
    }
}
