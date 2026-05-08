package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Movie;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface MovieDao extends MongoRepository<Movie, Integer> {
    List<Movie> findByIsDisplayTrueAndReleaseDateLessThanEqual(Date releaseDate);
    List<Movie> findByIsDisplayFalseAndReleaseDateGreaterThan(Date releaseDate);
    Movie getMovieByMovieId(int movieId);
}
