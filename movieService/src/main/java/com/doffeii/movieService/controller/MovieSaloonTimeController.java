package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.MovieSaloonTimeService;
import com.doffeii.movieService.entity.MovieSaloonTime;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/movieSaloonTimes/")
@RequiredArgsConstructor
//@CrossOrigin
public class MovieSaloonTimeController {

    private final MovieSaloonTimeService movieSaloonTimeService;

    @GetMapping("getMovieSaloonTimeSaloonAndMovieId/{saloonId}/{movieId}")
    public List<MovieSaloonTime> getMovieSaloonTimeSaloonAndMovieId(@PathVariable("saloonId") int saloonId,
                                                                    @PathVariable("movieId") int movieId) {
       return movieSaloonTimeService.getMovieSaloonTimeSaloonAndMovieId(saloonId, movieId);
    }
}
