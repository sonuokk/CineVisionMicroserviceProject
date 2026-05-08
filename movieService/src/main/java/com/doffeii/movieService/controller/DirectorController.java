package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.DirectorService;
import com.doffeii.movieService.entity.Director;
import com.doffeii.movieService.entity.dto.DirectorRequestDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/directors/")
@RequiredArgsConstructor
public class DirectorController {

    private final DirectorService directorService;


    @GetMapping("getall")
    public List<Director> getall() {
       return directorService.getall();
    }

    @PostMapping("add")
    @CircuitBreaker(name="director", fallbackMethod = "fallback")
    @Retry(name="director")
    public Director add(@RequestBody DirectorRequestDto directorRequestDto) {
        return directorService.add(directorRequestDto);
    }

    @SuppressWarnings("unused")
    private Director fallback(DirectorRequestDto directorRequestDto, RuntimeException runtimeException)  throws RuntimeException{
        return null;
    }

}
