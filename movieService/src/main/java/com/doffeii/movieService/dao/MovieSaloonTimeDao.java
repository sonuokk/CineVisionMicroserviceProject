package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.MovieSaloonTime;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieSaloonTimeDao extends MongoRepository<MovieSaloonTime, Integer> {
    List<MovieSaloonTime> getMovieSaloonTimeBySaloonSaloonIdAndMovieMovieId(int saloonId, int movieId);
    boolean existsBySaloonSaloonIdAndMovieMovieIdAndMovieBeginTime(int saloonId, int movieId, String movieBeginTime);
}
