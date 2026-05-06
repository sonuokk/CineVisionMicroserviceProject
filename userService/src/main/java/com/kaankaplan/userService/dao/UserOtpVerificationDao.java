package com.kaankaplan.userService.dao;

import com.kaankaplan.userService.entity.UserOtpVerification;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserOtpVerificationDao extends MongoRepository<UserOtpVerification, String> {
    UserOtpVerification findTopByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);

    void deleteByEmailAndPurpose(String email, String purpose);
}
