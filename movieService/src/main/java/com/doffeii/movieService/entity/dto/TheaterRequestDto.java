package com.doffeii.movieService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TheaterRequestDto {
    private int movieId;
    private String cityName;
    private String theaterName;
    private List<String> showtimes;
    private String token;
}
