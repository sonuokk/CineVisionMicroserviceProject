package com.kaankaplan.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "user_otp_verifications")
@CompoundIndex(name = "email_purpose_created_idx", def = "{'email': 1, 'purpose': 1, 'createdAt': -1}")
public class UserOtpVerification {
    @Id
    private String id;

    @Indexed
    private String email;

    @Indexed
    private String purpose;

    private String otpHash;
    private String customerName;
    private String phone;
    private String passwordHash;
    private Instant expiresAt;
    private Instant createdAt;
    private int attempts;
}
