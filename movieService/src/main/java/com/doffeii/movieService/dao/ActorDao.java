package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Actor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActorDao extends MongoRepository<Actor, Integer> {
    List<Actor> getActorsByMovieMovieId(int movieId);
}
