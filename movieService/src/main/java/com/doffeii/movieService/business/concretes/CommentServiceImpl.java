package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CommentService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.CommentDao;
import com.doffeii.movieService.entity.Comment;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.dto.CommentRequestDto;
import com.doffeii.movieService.entity.dto.DeleteCommentRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private final CommentDao commentDao;
    private final MovieService movieService;
    private final WebClient.Builder webClientBuilder;

    @Override
    public List<Comment> getCommentsByMovieId(int movieId, int pageNo, int pageSize) {
        Pageable pageable = PageRequest.of(pageNo - 1, pageSize);
        return commentDao.getCommentsByMovieMovieId(movieId, pageable);
    }

    @Override
    public int getNumberOfCommentsByMovieId(int movieId) {
        return commentDao.countCommentByMovieMovieId(movieId);
    }

    @Override
    public void deleteComment(DeleteCommentRequestDto deleteCommentRequestDto, String authorizationHeader) {
        Map<?, ?> currentUser = fetchCurrentUser(authorizationHeader, deleteCommentRequestDto.getToken());
        Comment comment = commentDao.findById(deleteCommentRequestDto.getCommentId())
                .orElseThrow(() -> new IllegalArgumentException("Review was already removed"));

        String currentUserId = stringValue(currentUser.get("userId"));
        String role = stringValue(currentUser.get("role"));
        boolean ownsReview = !currentUserId.isBlank() && currentUserId.equals(comment.getCommentByUserId());
        boolean admin = "ADMIN".equalsIgnoreCase(role) || "ROLE_ADMIN".equalsIgnoreCase(role);

        if (!ownsReview && !admin) {
            throw new IllegalArgumentException("You can delete only your own review");
        }

        commentDao.deleteById(deleteCommentRequestDto.getCommentId());
    }

    @Override
    public Comment addComment(CommentRequestDto commentRequestDto, String authorizationHeader) {
        Map<?, ?> currentUser = fetchCurrentUser(authorizationHeader, commentRequestDto.getToken());
        String reviewText = commentRequestDto.getCommentText() == null ? "" : commentRequestDto.getCommentText().trim();
        if (reviewText.isBlank()) {
            throw new IllegalArgumentException("Review cannot be empty");
        }

        Movie movie = movieService.getMovieById(commentRequestDto.getMovieId());
        String fullName = stringValue(currentUser.get("fullName"));
        String email = stringValue(currentUser.get("email"));

        Comment comment = Comment.builder()
                .commentId(nextCommentId())
                .commentByUserId(stringValue(currentUser.get("userId")))
                .commentBy(fullName.isBlank() ? email : fullName)
                .commentText(reviewText)
                .rating(validateRating(commentRequestDto.getRating()))
                .movie(movie)
                .build();

        return commentDao.save(comment);
    }

    @Override
    public double getAverageRatingByMovieId(int movieId) {
        return commentDao.getAverageRatingByMovieId(movieId);
    }

    private int validateRating(int rating) {
        if (rating == 0) {
            return 0;
        }
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        return rating;
    }

    private int nextCommentId() {
        return commentDao.findAll().stream()
                .map(Comment::getCommentId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }

    private Map<?, ?> fetchCurrentUser(String authorizationHeader, String bodyToken) {
        String resolvedAuthorization = resolveAuthorizationHeader(authorizationHeader, bodyToken);
        if (resolvedAuthorization.isBlank()) {
            throw new IllegalArgumentException("Sign in is required to review");
        }

        Map<?, ?> currentUser = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/me")
                .header(HttpHeaders.AUTHORIZATION, resolvedAuthorization)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (currentUser == null || currentUser.isEmpty()) {
            throw new IllegalArgumentException("Sign in is required to review");
        }
        return currentUser;
    }

    private String resolveAuthorizationHeader(String authorizationHeader, String bodyToken) {
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            return authorizationHeader;
        }
        if (bodyToken != null && !bodyToken.isBlank()) {
            return bodyToken.startsWith("Bearer ") ? bodyToken : "Bearer " + bodyToken;
        }
        return "";
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
