package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.MovieImage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieImageDao extends MongoRepository<MovieImage, Integer> {
}
