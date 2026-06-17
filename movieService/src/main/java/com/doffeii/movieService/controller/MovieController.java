package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.dto.MovieRequestDto;
import com.doffeii.movieService.entity.dto.MovieResponseDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/movies/")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping("displayingMovies")
    public List<MovieResponseDto> getAllDisplayingMoviesInVision() {
        return movieService.getAllDisplayingMoviesInVision();
    }

    @GetMapping("comingSoonMovies")
    public List<MovieResponseDto> getAllComingSoonMovies() {
        return movieService.getAllComingSoonMovies();
    }

    @GetMapping("all")
    public List<MovieResponseDto> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("city/{cityName}")
    public List<MovieResponseDto> getMoviesByCity(@PathVariable("cityName") String cityName) {
        return movieService.getMoviesByCity(cityName);
    }

    @GetMapping("{movieId}")
    public MovieResponseDto getMovieById(@PathVariable("movieId") int movieId) {
        return movieService.getMovieByMovieId(movieId);
    }

    @PostMapping("add")
    @CircuitBreaker(name="movie", fallbackMethod = "fallback")
    @Retry(name="movie")
    public Movie addMovie(@RequestBody MovieRequestDto movieRequestDto) {
        return movieService.addMovie(movieRequestDto);
    }

    @DeleteMapping("{movieId}")
    public void deleteMovie(@PathVariable("movieId") int movieId,
                            @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        movieService.deleteMovie(movieId, authorizationHeader);
    }

    @SuppressWarnings("unused")
    private Movie fallback(MovieRequestDto movieRequestDto, RuntimeException runtimeException) throws RuntimeException {
        return null;
    }

}
