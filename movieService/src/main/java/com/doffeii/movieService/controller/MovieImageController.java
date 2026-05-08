package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.MovieImageService;
import com.doffeii.movieService.entity.dto.ImageRequestDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/movie/images/")
@RequiredArgsConstructor
public class MovieImageController {

    private final MovieImageService movieImageService;

    @PostMapping("add")
    @CircuitBreaker(name = "image", fallbackMethod = "fallback")
    @Retry(name = "image")
    public void add(@RequestBody ImageRequestDto imageRequestDto) {
        movieImageService.addMovieImage(imageRequestDto);
    }

    @SuppressWarnings("unused")
    private void fallback(ImageRequestDto imageRequestDto, RuntimeException runtimeException) { }
}
