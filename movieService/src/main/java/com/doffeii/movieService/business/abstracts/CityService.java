package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.City;
import com.doffeii.movieService.entity.dto.CityRequestDto;
import com.doffeii.movieService.entity.dto.TheaterRequestDto;

import java.util.List;

public interface CityService {

    List<City> getCitiesByMovieId(int movieId);

    List<City> getTheaterLibrary();

    List<City> getall();

    void add(CityRequestDto cityRequestDto);

    City addTheaterToLibrary(TheaterRequestDto theaterRequestDto, String authorizationHeader);

    City addTheater(TheaterRequestDto theaterRequestDto, String authorizationHeader);

    void deleteTheater(int movieId, int cityId, int theaterId, String authorizationHeader);

    void deleteCityFromMovie(int movieId, int cityId, String authorizationHeader);
}
