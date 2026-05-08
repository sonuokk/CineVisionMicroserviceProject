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
public class FavoriteTheaterRequestDto {
    @NotBlank(message = "Theater name is required")
    private String theaterName;

    private String cityName;
}
