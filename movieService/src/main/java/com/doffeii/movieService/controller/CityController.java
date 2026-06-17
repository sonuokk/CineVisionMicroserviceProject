package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.CityService;
import com.doffeii.movieService.entity.City;
import com.doffeii.movieService.entity.dto.CityRequestDto;
import com.doffeii.movieService.entity.dto.TheaterRequestDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/cities/")
@RequiredArgsConstructor
public class CityController {

    private final CityService cityService;

    @GetMapping("getCitiesByMovieId/{movieId}")
    public List<City> getCitiesByMovieId(@PathVariable("movieId") int movieId) {
        return cityService.getCitiesByMovieId(movieId);
    }

    @GetMapping("getall")
    public List<City> getall() {
        return cityService.getall();
    }

    @GetMapping("theaters/library")
    public List<City> getTheaterLibrary() {
        return cityService.getTheaterLibrary();
    }

    @PostMapping("add")
    @CircuitBreaker(name="city", fallbackMethod = "fallback")
    @Retry(name="city")
    public void add(@RequestBody CityRequestDto cityRequestDto) {
        cityService.add(cityRequestDto);
    }

    @PostMapping("theaters/library")
    public City addTheaterToLibrary(@RequestBody TheaterRequestDto theaterRequestDto,
                                    @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return cityService.addTheaterToLibrary(theaterRequestDto, authorizationHeader);
    }

    @PostMapping("theaters")
    public City addTheater(@RequestBody TheaterRequestDto theaterRequestDto,
                           @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return cityService.addTheater(theaterRequestDto, authorizationHeader);
    }

    @DeleteMapping("{cityId}/theaters/{theaterId}")
    public void deleteTheater(@PathVariable("cityId") int cityId,
                              @PathVariable("theaterId") int theaterId,
                              @RequestParam("movieId") int movieId,
                              @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        cityService.deleteTheater(movieId, cityId, theaterId, authorizationHeader);
    }

    @DeleteMapping("{cityId}")
    public void deleteCityFromMovie(@PathVariable("cityId") int cityId,
                                    @RequestParam("movieId") int movieId,
                                    @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        cityService.deleteCityFromMovie(movieId, cityId, authorizationHeader);
    }

    @SuppressWarnings("unused")
    private void fallback(CityRequestDto cityRequestDto, RuntimeException runtimeException) { }

}
