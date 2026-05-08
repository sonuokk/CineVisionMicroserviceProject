package com.doffeii.movieService.dao.mongo;

import com.doffeii.movieService.entity.mongo.MovieDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface MovieDocumentDao extends MongoRepository<MovieDocument, String> {
    MovieDocument findByMovieId(int movieId);
}
