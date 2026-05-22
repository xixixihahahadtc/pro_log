package com.blogpro.service;

import com.blogpro.entity.User;

public interface UserService {
    String register(User user);
    String login(User user);
}
