package com.doffeii.userService.dao;

import com.doffeii.userService.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserDao extends MongoRepository<User, String> {

    User findUserByUserId(String userId);

    User findUserByEmail(String email);
}
