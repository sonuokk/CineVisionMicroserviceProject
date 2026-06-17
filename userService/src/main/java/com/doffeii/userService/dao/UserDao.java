package com.doffeii.userService.dao;

import com.doffeii.userService.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;

public interface UserDao extends MongoRepository<User, String> {

    User findUserByUserId(String userId);

    User findUserByEmail(String email);

    List<User> findByTheaterManagerRequestStatusAndTheaterManagerDeleteAfterBefore(String status, Instant cutoff);
}
