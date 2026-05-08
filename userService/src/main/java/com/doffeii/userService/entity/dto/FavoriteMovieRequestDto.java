package com.doffeii.userService.entity.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteMovieRequestDto {
    @Min(value = 1, message = "Movie id is required")
    private int movieId;

    @NotBlank(message = "Movie name is required")
    private String movieName;

    private String movieImageUrl;
}
