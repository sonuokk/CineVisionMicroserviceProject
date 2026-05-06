package com.kaankaplan.userService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OtpRequestResponseDto {
    private String message;
    private String email;
    private Instant expiresAt;
    private String developmentOtp;
}
