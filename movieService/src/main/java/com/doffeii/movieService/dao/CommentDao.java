package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Comment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentDao extends MongoRepository<Comment, Integer> {
    List<Comment> getCommentsByMovieMovieId(int movieId, Pageable pageable);
    int countCommentByMovieMovieId(int movieId);
    List<Comment> findByMovieMovieIdAndRatingGreaterThan(int movieId, int rating);

    default double getAverageRatingByMovieId(int movieId) {
        List<Comment> ratings = findByMovieMovieIdAndRatingGreaterThan(movieId, 0);
        return ratings.stream().mapToInt(Comment::getRating).average().orElse(0);
    }
}
