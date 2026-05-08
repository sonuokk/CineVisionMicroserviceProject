package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Director;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DirectorDao extends MongoRepository<Director, Integer> {
    Director getDirectorByDirectorId(int directorId);
}
