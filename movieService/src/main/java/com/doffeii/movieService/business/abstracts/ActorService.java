package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.Actor;
import com.doffeii.movieService.entity.dto.ActorRequestDto;

import java.util.List;

public interface ActorService {

    List<Actor> getActorsByMovieId(int movieId);

    List<Actor> getall();

    void addActors(ActorRequestDto actorRequestDto);
}
