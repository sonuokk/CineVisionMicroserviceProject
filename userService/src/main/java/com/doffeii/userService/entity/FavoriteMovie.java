package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteMovie {
    private int movieId;
    private String movieName;
    private String movieImageUrl;
    private Instant addedAt;
}
