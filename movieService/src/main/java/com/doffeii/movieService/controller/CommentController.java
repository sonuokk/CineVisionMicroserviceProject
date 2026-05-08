package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.CommentService;
import com.doffeii.movieService.entity.Comment;
import com.doffeii.movieService.entity.dto.CommentRequestDto;
import com.doffeii.movieService.entity.dto.DeleteCommentRequestDto;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/comments/")
@CrossOrigin
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("getCommentsByMovieId/{movieId}/{pageNo}/{pageSize}")
    public List<Comment> getCommentsByMovieId(@PathVariable("movieId") int movieId, @PathVariable("pageNo") int pageNo, @PathVariable("pageSize") int pageSize) {
        return commentService.getCommentsByMovieId(movieId, pageNo, pageSize);
    }

    @GetMapping("getCountOfComments/{movieId}")
    public int getNumberOfCommentsByMovieId(@PathVariable("movieId") int movieId) {
        return commentService.getNumberOfCommentsByMovieId(movieId);
    }

    @GetMapping("getAverageRating/{movieId}")
    public double getAverageRatingByMovieId(@PathVariable("movieId") int movieId) {
        return commentService.getAverageRatingByMovieId(movieId);
    }

    @PostMapping("add")
    @CircuitBreaker(name = "comment", fallbackMethod = "fallback")
    @Retry(name="comment")
    public Comment addComment(@RequestBody CommentRequestDto comment) {
        return commentService.addComment(comment);
    }

    @PostMapping("delete")
    public void deleteComment(@RequestBody DeleteCommentRequestDto deleteCommentRequestDto) {
        commentService.deleteComment(deleteCommentRequestDto);
    }
    @SuppressWarnings("unused")
    private Comment fallback(CommentRequestDto commentRequestDto, RuntimeException runtimeException) throws RuntimeException{
        return null;
    }

}
