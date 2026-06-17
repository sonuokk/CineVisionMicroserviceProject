package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CategoryService;
import com.doffeii.movieService.business.abstracts.DirectorService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.CityDao;
import com.doffeii.movieService.dao.CommentDao;
import com.doffeii.movieService.dao.MovieDao;
import com.doffeii.movieService.dao.MovieSaloonTimeDao;
import com.doffeii.movieService.dao.PaymentCardDetailDao;
import com.doffeii.movieService.dao.TicketBookingDao;
import com.doffeii.movieService.entity.Category;
import com.doffeii.movieService.entity.Director;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieImage;
import com.doffeii.movieService.entity.TicketBooking;
import com.doffeii.movieService.entity.dto.MovieRequestDto;
import com.doffeii.movieService.entity.dto.MovieResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements MovieService {

    private final MovieDao movieDao;
    private final TicketBookingDao ticketBookingDao;
    private final PaymentCardDetailDao paymentCardDetailDao;
    private final CommentDao commentDao;
    private final CityDao cityDao;
    private final MovieSaloonTimeDao movieSaloonTimeDao;
    private final CategoryService categoryService;
    private final DirectorService directorService;
    private final WebClient.Builder webClientBuilder;

    @Cacheable(value = "displaying_movies")
    @Override
    public List<MovieResponseDto> getAllDisplayingMoviesInVision() {
        Date now = new Date();
        List<MovieResponseDto> movies = movieDao.findAll().stream()
                .filter(movie -> isNowShowing(movie, now))
                .map(movie -> toMovieResponseDto(movie, true))
                .toList();
        movies.forEach(this::syncMovieDocument);
        return movies;
    }

    @Cacheable(value = "comingSoon_movies")
    @Override
    public List<MovieResponseDto> getAllComingSoonMovies() {
        Date now = new Date();
        List<MovieResponseDto> movies = movieDao.findAll().stream()
                .filter(movie -> !isNowShowing(movie, now) && isFutureRelease(movie, now))
                .map(movie -> toMovieResponseDto(movie, false))
                .toList();
        movies.forEach(this::syncMovieDocument);
        return movies;
    }

    @Override
    public List<MovieResponseDto> getAllMovies() {
        return movieDao.findAll().stream()
                .map(movie -> toMovieResponseDto(movie, isNowShowing(movie, new Date())))
                .toList();
    }

    @Override
    public List<MovieResponseDto> getMoviesByCity(String cityName) {
        String normalizedCityName = cityName == null ? "" : cityName.trim();
        if (normalizedCityName.isBlank()) {
            return List.of();
        }

        Date now = new Date();
        Map<Integer, MovieResponseDto> moviesById = new LinkedHashMap<>();
        cityDao.findAll().stream()
                .filter(city -> city.getCityName() != null
                        && city.getCityName().trim().equalsIgnoreCase(normalizedCityName)
                        && city.getMovie() != null
                        && city.getMovie().getMovieId() != null)
                .map(city -> movieDao.getMovieByMovieId(city.getMovie().getMovieId()))
                .filter(movie -> movie != null && isNowShowing(movie, now))
                .forEach(movie -> moviesById.putIfAbsent(movie.getMovieId(), toMovieResponseDto(movie, true)));

        return List.copyOf(moviesById.values());
    }

    @Override
    public MovieResponseDto getMovieByMovieId(int movieId) {
        Movie rawMovie = movieDao.getMovieByMovieId(movieId);
        MovieResponseDto movie = toMovieResponseDto(rawMovie, isNowShowing(rawMovie, new Date()));
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
        if (canManageMovies("Bearer " + movieRequestDto.getUserAccessToken())) {
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
            syncMovieDocument(toMovieResponseDto(savedMovie, isNowShowing(savedMovie, new Date())));
            return savedMovie;
        }

        throw new RuntimeException("Only admins and theater managers can add movies");
    }

    @CacheEvict(value = {"displaying_movies", "comingSoon_movies", "cities"}, allEntries = true)
    @Override
    public void deleteMovie(int movieId, String authorizationHeader) {
        ensureCanManageMovies(authorizationHeader);

        Movie movie = movieDao.getMovieByMovieId(movieId);
        if (movie == null) {
            throw new IllegalArgumentException("Movie was not found");
        }

        List<TicketBooking> bookings = ticketBookingDao.findByMovieNameIgnoreCase(movie.getMovieName());
        List<String> bookingCodes = bookings.stream()
                .map(TicketBooking::getBookingCode)
                .filter(code -> code != null && !code.isBlank())
                .toList();
        if (!bookingCodes.isEmpty()) {
            paymentCardDetailDao.deleteByBookingBookingCodeIn(bookingCodes);
            ticketBookingDao.deleteAll(bookings);
        }

        commentDao.deleteByMovieMovieId(movieId);
        movieSaloonTimeDao.deleteByMovieMovieId(movieId);
        cityDao.deleteByMovieMovieId(movieId);
        movieDao.delete(movie);
    }

    private void ensureCanManageMovies(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Admin or theater manager sign in is required");
        }

        if (!canManageMovies(authorizationHeader)) {
            throw new RuntimeException("Only admins and theater managers can manage movies");
        }
    }

    private boolean canManageMovies(String authorizationHeader) {
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/canManageTheaters")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        return Boolean.TRUE.equals(result);
    }

    private int nextMovieId() {
        return movieDao.findAll().stream()
                .map(Movie::getMovieId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }

    private boolean isNowShowing(Movie movie, Date now) {
        if (movie == null) {
            return false;
        }
        return movie.isDisplay() || !isFutureRelease(movie, now);
    }

    private boolean isFutureRelease(Movie movie, Date now) {
        return movie != null && movie.getReleaseDate() != null && movie.getReleaseDate().after(now);
    }

    private MovieResponseDto toMovieResponseDto(Movie movie, boolean display) {
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
                .isDisplay(display)
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
