package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieSnapshot {
    private String id;
    private int movieId;
    private String movieName;
    private String description;
    private int duration;
    private Date releaseDate;
    private boolean display;
    private int categoryId;
    private String categoryName;
    private String movieImageUrl;
    private String movieTrailerUrl;
    private String directorName;
    private Instant syncedAt;
}
