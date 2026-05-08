package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.City;
import com.doffeii.movieService.entity.dto.CityRequestDto;

import java.util.List;

public interface CityService {

    List<City> getCitiesByMovieId(int movieId);

    List<City> getall();

    void add(CityRequestDto cityRequestDto);
}
