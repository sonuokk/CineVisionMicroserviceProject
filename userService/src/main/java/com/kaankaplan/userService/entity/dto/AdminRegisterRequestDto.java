package com.kaankaplan.userService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminRegisterRequestDto {
    private String fullName;
    private String email;
    private String password;
    private String setupKey;
}
