package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.Comment;
import com.doffeii.movieService.entity.dto.CommentRequestDto;
import com.doffeii.movieService.entity.dto.DeleteCommentRequestDto;

import java.util.List;

public interface CommentService {

    List<Comment> getCommentsByMovieId(int movieId, int pageNo, int pageSize);

    void deleteComment(DeleteCommentRequestDto deleteCommentRequestDto, String authorizationHeader);

    Comment addComment(CommentRequestDto commentRequestDto, String authorizationHeader);

    int getNumberOfCommentsByMovieId(int movieId);

    double getAverageRatingByMovieId(int movieId);
}
