package com.doffeii.userService.entity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleAuthRequestDto {
    @NotBlank(message = "Google credential is required")
    private String credential;
    private String role;
    private String theaterName;
}
