package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CategoryService;
import com.doffeii.movieService.business.abstracts.DirectorService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.MovieDao;
import com.doffeii.movieService.entity.Category;
import com.doffeii.movieService.entity.Director;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieImage;
import com.doffeii.movieService.entity.dto.MovieRequestDto;
import com.doffeii.movieService.entity.dto.MovieResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieDao movieDao;
    private final CategoryService categoryService;
    private final DirectorService directorService;
    private final WebClient.Builder webClientBuilder;

    @Cacheable(value = "displaying_movies")
    @Override
    public List<MovieResponseDto> getAllDisplayingMoviesInVision() {
        List<MovieResponseDto> movies = movieDao.findByIsDisplayTrueAndReleaseDateLessThanEqual(new Date()).stream()
                .map(this::toMovieResponseDto)
                .toList();
        movies.forEach(this::syncMovieDocument);
        return movies;
    }

    @Cacheable(value = "comingSoon_movies")
    @Override
    public List<MovieResponseDto> getAllComingSoonMovies() {
        List<MovieResponseDto> movies = movieDao.findByIsDisplayFalseAndReleaseDateGreaterThan(new Date()).stream()
                .map(this::toMovieResponseDto)
                .toList();
        movies.forEach(this::syncMovieDocument);
        return movies;
    }

    @Override
    public MovieResponseDto getMovieByMovieId(int movieId) {
        MovieResponseDto movie = toMovieResponseDto(movieDao.getMovieByMovieId(movieId));
        syncMovieDocument(movie);
        return movie;
    }

    @Override
    public Movie getMovieById(int movieId) {
        return movieDao.getMovieByMovieId(movieId);
    }

    @CacheEvict(value = {"displaying_movies", "comingSoon_movies"}, allEntries = true)
    @Override
    public Movie addMovie(MovieRequestDto movieRequestDto) {
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + movieRequestDto.getUserAccessToken())
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();

        if (Boolean.TRUE.equals(result)) {
            Category category = categoryService.getCategoryById(movieRequestDto.getCategoryId());
            Director director = directorService.getDirectorById(movieRequestDto.getDirectorId());

            Movie movie = Movie.builder()
                    .movieId(nextMovieId())
                    .movieName(movieRequestDto.getMovieName())
                    .description(movieRequestDto.getDescription())
                    .duration(movieRequestDto.getDuration())
                    .releaseDate(movieRequestDto.getReleaseDate())
                    .movieTrailerUrl(movieRequestDto.getTrailerUrl())
                    .category(category)
                    .director(director)
                    .isDisplay(movieRequestDto.isInVision())
                    .build();
            Movie savedMovie = movieDao.save(movie);
            syncMovieDocument(toMovieResponseDto(savedMovie));
            return savedMovie;
        }

        throw new RuntimeException("Only admins can add movies");
    }

    private int nextMovieId() {
        return movieDao.findAll().stream()
                .map(Movie::getMovieId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }

    private MovieResponseDto toMovieResponseDto(Movie movie) {
        if (movie == null) {
            return null;
        }
        Category category = movie.getCategory();
        Director director = movie.getDirector();
        MovieImage image = movie.getImage();
        return MovieResponseDto.builder()
                .movieId(movie.getMovieId() == null ? 0 : movie.getMovieId())
                .movieName(movie.getMovieName())
                .description(movie.getDescription())
                .duration(movie.getDuration())
                .releaseDate(movie.getReleaseDate())
                .isDisplay(movie.isDisplay())
                .categoryId(category == null || category.getCategoryId() == null ? 0 : category.getCategoryId())
                .categoryName(category == null ? null : category.getCategoryName())
                .movieImageUrl(image == null ? null : image.getImageUrl())
                .movieTrailerUrl(movie.getMovieTrailerUrl())
                .directorName(director == null ? null : director.getDirectorName())
                .build();
    }

    private void syncMovieDocument(MovieResponseDto movie) {
        // Movies are already stored directly in the MongoDB "movies" collection.
    }
}
