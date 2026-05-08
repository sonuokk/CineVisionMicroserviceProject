package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Saloon;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SaloonDao extends MongoRepository<Saloon, Integer> {
    Optional<Saloon> findFirstByCityCityIdAndSaloonNameIgnoreCase(int cityId, String saloonName);
}
