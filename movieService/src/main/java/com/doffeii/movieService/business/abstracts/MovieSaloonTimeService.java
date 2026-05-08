package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.MovieSaloonTime;

import java.util.List;

public interface MovieSaloonTimeService {

    List<MovieSaloonTime> getMovieSaloonTimeSaloonAndMovieId(int saloonId, int movieId);
}
