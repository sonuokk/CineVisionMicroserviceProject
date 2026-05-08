package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.City;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityDao extends MongoRepository<City, Integer> {
    List<City> getCitiesByMovieMovieId(int movieId);
    Optional<City> findFirstByMovieMovieIdAndCityNameIgnoreCase(int movieId, String cityName);
}
