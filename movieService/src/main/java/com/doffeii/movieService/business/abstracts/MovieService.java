package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.dto.MovieRequestDto;
import com.doffeii.movieService.entity.dto.MovieResponseDto;

import java.util.List;

public interface MovieService {

    List<MovieResponseDto> getAllDisplayingMoviesInVision();

    List<MovieResponseDto> getAllComingSoonMovies();

    List<MovieResponseDto> getAllMovies();

    List<MovieResponseDto> getMoviesByCity(String cityName);

    MovieResponseDto getMovieByMovieId(int movieId);

    Movie getMovieById(int movieId);

    Movie addMovie(MovieRequestDto movieRequestDto);

    void deleteMovie(int movieId, String authorizationHeader);
}
