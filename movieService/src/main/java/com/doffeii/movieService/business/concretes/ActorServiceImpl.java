package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.ActorService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.ActorDao;
import com.doffeii.movieService.entity.Actor;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.dto.ActorRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ActorServiceImpl implements ActorService {

    private final ActorDao actorDao;
    private final MovieService movieService;
    private final WebClient.Builder webClientBuilder;

    @Override
    public List<Actor> getActorsByMovieId(int movieId) {

        return actorDao.getActorsByMovieMovieId(movieId);
    }

    @Cacheable(value = "actors")
    @Override
    public List<Actor> getall() {
        return actorDao.findAll(Sort.by(Sort.Direction.ASC, "actorName"));
    }

    @CacheEvict(value = "actors", allEntries = true)
    @Override
    public void addActors(ActorRequestDto actorRequestDto) {

        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + actorRequestDto.getToken())
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();

        if (result) {
            Movie movie = movieService.getMovieById(actorRequestDto.getMovieId());

            for (String actorName: actorRequestDto.getActorNameList()) {
                Actor actor = Actor.builder()
                        .actorId(nextActorId())
                        .actorName(actorName)
                        .movie(movie)
                        .build();
                actorDao.save(actor);
            }
        }

    }

    private int nextActorId() {
        return actorDao.findAll().stream()
                .map(Actor::getActorId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }}