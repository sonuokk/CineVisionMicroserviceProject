package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CityService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.CityDao;
import com.doffeii.movieService.dao.MovieSaloonTimeDao;
import com.doffeii.movieService.dao.SaloonDao;
import com.doffeii.movieService.entity.City;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieSaloonTime;
import com.doffeii.movieService.entity.Saloon;
import com.doffeii.movieService.entity.dto.CityRequestDto;
import com.doffeii.movieService.entity.dto.TheaterRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CityServiceImpl implements CityService {

    private final CityDao cityDao;
    private final SaloonDao saloonDao;
    private final MovieSaloonTimeDao movieSaloonTimeDao;
    private final MovieService movieService;
    private final WebClient.Builder webClientBuilder;

    private static final List<String> DEFAULT_SHOW_TIMES = List.of("10:30", "13:45", "17:00", "20:15");


    @Override
    public List<City> getCitiesByMovieId(int movieId) {
        Map<Integer, City> citiesById = new LinkedHashMap<>();
        movieSaloonTimeDao.findByMovieMovieId(movieId).forEach(showtime -> {
            Saloon theater = showtime.getSaloon();
            if (theater == null || theater.getCity() == null) {
                return;
            }
            City theaterCity = theater.getCity();
            City city = citiesById.computeIfAbsent(theaterCity.getCityId(), id -> City.builder()
                    .cityId(theaterCity.getCityId())
                    .cityName(theaterCity.getCityName())
                    .movie(showtime.getMovie())
                    .theaters(new ArrayList<>())
                    .build());
            boolean alreadyAdded = city.getTheaters().stream()
                    .anyMatch(existing -> existing.getSaloonId() != null
                            && existing.getSaloonId().equals(theater.getSaloonId()));
            if (!alreadyAdded) {
                theater.setShowtimes(movieSaloonTimeDao
                        .getMovieSaloonTimeByTheaterTheaterIdAndMovieMovieId(theater.getSaloonId(), movieId)
                        .stream()
                        .map(MovieSaloonTime::getMovieBeginTime)
                        .filter(time -> time != null && !time.isBlank())
                        .distinct()
                        .toList());
                city.getTheaters().add(theater);
            }
        });
        return new ArrayList<>(citiesById.values());
    }

    @Override
    public List<City> getTheaterLibrary() {
        Map<Integer, City> citiesById = new LinkedHashMap<>();
        saloonDao.findAll().forEach(theater -> {
            if (theater.getCity() == null || theater.getCity().getCityId() == null) {
                return;
            }
            City theaterCity = theater.getCity();
            City city = citiesById.computeIfAbsent(theaterCity.getCityId(), id -> City.builder()
                    .cityId(theaterCity.getCityId())
                    .cityName(theaterCity.getCityName())
                    .theaters(new ArrayList<>())
                    .build());
            theater.setShowtimes(movieSaloonTimeDao.findAll().stream()
                    .filter(showtime -> showtime.getSaloon() != null
                            && showtime.getSaloon().getSaloonId() != null
                            && showtime.getSaloon().getSaloonId().equals(theater.getSaloonId()))
                    .map(MovieSaloonTime::getMovieBeginTime)
                    .filter(time -> time != null && !time.isBlank())
                    .distinct()
                    .toList());
            city.getTheaters().add(theater);
        });
        return new ArrayList<>(citiesById.values());
    }

    @Cacheable(value = "cities")
    @Override
    public List<City> getall() {
        return cityDao.findAll(Sort.by(Sort.Direction.ASC, "cityName"));
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public void add(CityRequestDto cityRequestDto) {
        if (isAdminToken(cityRequestDto.getToken())) {
            Movie movie = movieService.getMovieById(cityRequestDto.getMovieId());
            for (String cityName: cityRequestDto.getCityNameList()) {
                City city = City.builder()
                        .cityId(nextCityId())
                        .cityName(cityName)
                        .movie(movie)
                        .build();
                City savedCity = cityDao.save(city);
                createDefaultSaloonsAndTimes(savedCity, movie);
            }
            return;
        }
        throw new RuntimeException("Only admins can add cities to a movie");
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public City addTheaterToLibrary(TheaterRequestDto theaterRequestDto, String authorizationHeader) {
        String cityName = normalizeRequired(theaterRequestDto.getCityName(), "City name is required");
        String theaterName = normalizeRequired(theaterRequestDto.getTheaterName(), "Theater name is required");
        if (!canManageTheaters(theaterRequestDto.getToken(), authorizationHeader)) {
            throw new RuntimeException("Only admins and theater managers can create theatres");
        }

        City city = cityDao.findFirstByMovieIsNullAndCityNameIgnoreCase(cityName)
                .orElseGet(() -> cityDao.save(City.builder()
                        .cityId(nextCityId())
                        .cityName(cityName)
                        .theaters(new ArrayList<>())
                        .build()));

        if (city.getCityId() == null) {
            city.setCityId(nextCityId());
            city = cityDao.save(city);
        }

        City savedCity = city;
        saloonDao.findFirstByCityCityIdAndTheaterNameIgnoreCase(savedCity.getCityId(), theaterName)
                .orElseGet(() -> {
                    Saloon newTheater = new Saloon();
                    newTheater.setSaloonId(nextSaloonId());
                    newTheater.setCity(savedCity);
                    newTheater.setSaloonName(theaterName);
                    return saloonDao.save(newTheater);
                });
        return getTheaterLibrary().stream()
                .filter(existing -> existing.getCityId() != null && existing.getCityId().equals(savedCity.getCityId()))
                .findFirst()
                .orElse(savedCity);
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public City addTheater(TheaterRequestDto theaterRequestDto, String authorizationHeader) {
        String cityName = normalizeRequired(theaterRequestDto.getCityName(), "City name is required");
        String theaterName = normalizeRequired(theaterRequestDto.getTheaterName(), "Theater name is required");
        if (!canManageTheater(theaterRequestDto.getToken(), authorizationHeader, theaterName)) {
            throw new RuntimeException("Only admins and assigned theater managers can manage this theater");
        }

        Movie movie = movieService.getMovieById(theaterRequestDto.getMovieId());
        if (movie == null) {
            throw new IllegalArgumentException("Movie was not found");
        }

        City city = cityDao.findFirstByMovieIsNullAndCityNameIgnoreCase(cityName)
                .orElseGet(() -> cityDao.save(City.builder()
                        .cityId(nextCityId())
                        .cityName(cityName)
                        .theaters(new ArrayList<>())
                        .build()));

        if (city.getCityId() == null) {
            city.setCityId(nextCityId());
            city = cityDao.save(city);
        }

        City savedCity = city;
        Saloon theater = saloonDao.findFirstByCityCityIdAndTheaterNameIgnoreCase(savedCity.getCityId(), theaterName)
                .orElseGet(() -> {
                    Saloon newTheater = new Saloon();
                    newTheater.setSaloonId(nextSaloonId());
                    newTheater.setCity(savedCity);
                    newTheater.setSaloonName(theaterName);
                    return saloonDao.save(newTheater);
                });

        List<String> showtimes = theaterRequestDto.getShowtimes() == null || theaterRequestDto.getShowtimes().isEmpty()
                ? DEFAULT_SHOW_TIMES
                : theaterRequestDto.getShowtimes();
        showtimes.stream()
                .map(time -> time == null ? "" : time.trim())
                .filter(time -> !time.isBlank())
                .distinct()
                .forEach(time -> ensureShowtime(movie, theater, time));

        return getCitiesByMovieId(movie.getMovieId()).stream()
                .filter(existing -> existing.getCityId() != null && existing.getCityId().equals(savedCity.getCityId()))
                .findFirst()
                .orElse(savedCity);
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public void deleteTheater(int movieId, int cityId, int theaterId, String authorizationHeader) {
        Saloon theater = saloonDao.findById(theaterId)
                .orElseThrow(() -> new IllegalArgumentException("Theater was not found"));
        ensureTheaterManagementAuthorization(authorizationHeader, theater.getTheaterName());
        movieSaloonTimeDao.deleteByTheaterTheaterIdAndMovieMovieId(theaterId, movieId);
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public void deleteCityFromMovie(int movieId, int cityId, String authorizationHeader) {
        ensureAdminAuthorization(authorizationHeader);
        movieSaloonTimeDao.deleteByTheaterCityCityIdAndMovieMovieId(cityId, movieId);
    }

    private void createDefaultSaloonsAndTimes(City city, Movie movie) {
        for (int screenNumber = 1; screenNumber <= 2; screenNumber++) {
            Saloon saloon = new Saloon();
            saloon.setSaloonId(nextSaloonId());
            saloon.setCity(city);
            saloon.setSaloonName(city.getCityName() + " CineSaga Screen " + screenNumber);
            Saloon savedSaloon = saloonDao.save(saloon);

            for (String showTime : DEFAULT_SHOW_TIMES) {
                MovieSaloonTime movieSaloonTime = new MovieSaloonTime();
                movieSaloonTime.setId(nextShowtimeId());
                movieSaloonTime.setMovie(movie);
                movieSaloonTime.setSaloon(savedSaloon);
                movieSaloonTime.setMovieBeginTime(showTime);
                movieSaloonTimeDao.save(movieSaloonTime);
            }
        }
    }

    private void ensureShowtime(Movie movie, Saloon theater, String showTime) {
        if (movieSaloonTimeDao.existsByTheaterTheaterIdAndMovieMovieIdAndMovieBeginTime(
                theater.getSaloonId(), movie.getMovieId(), showTime)) {
            return;
        }

        MovieSaloonTime movieSaloonTime = new MovieSaloonTime();
        movieSaloonTime.setId(nextShowtimeId());
        movieSaloonTime.setMovie(movie);
        movieSaloonTime.setSaloon(theater);
        movieSaloonTime.setMovieBeginTime(showTime);
        movieSaloonTimeDao.save(movieSaloonTime);
    }

    private boolean isAdminToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        return Boolean.TRUE.equals(result);
    }

    private boolean canManageTheater(String token, String authorizationHeader, String theaterName) {
        String authorizationValue = resolveAuthorizationValue(token, authorizationHeader);
        if (authorizationValue.isBlank()) {
            return false;
        }
        String uri = UriComponentsBuilder
                .fromUriString("http://USERSERVICE/api/user/users/canManageTheater")
                .queryParam("theaterName", theaterName)
                .toUriString();
        Boolean result = webClientBuilder.build().get()
                .uri(uri)
                .header("Authorization", authorizationValue)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        return Boolean.TRUE.equals(result);
    }

    private boolean canManageTheaters(String token, String authorizationHeader) {
        String authorizationValue = resolveAuthorizationValue(token, authorizationHeader);
        if (authorizationValue.isBlank()) {
            return false;
        }
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/canManageTheaters")
                .header("Authorization", authorizationValue)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        return Boolean.TRUE.equals(result);
    }

    private String resolveAuthorizationValue(String token, String authorizationHeader) {
        if (authorizationHeader != null && !authorizationHeader.isBlank()) {
            return authorizationHeader;
        }
        if (token == null || token.isBlank()) {
            return "";
        }
        return token.startsWith("Bearer ") ? token : "Bearer " + token;
    }

    private void ensureTheaterManagementAuthorization(String authorizationHeader, String theaterName) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Admin or theater manager sign in is required");
        }
        String uri = UriComponentsBuilder
                .fromUriString("http://USERSERVICE/api/user/users/canManageTheater")
                .queryParam("theaterName", theaterName)
                .toUriString();
        Boolean result = webClientBuilder.build().get()
                .uri(uri)
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        if (!Boolean.TRUE.equals(result)) {
            throw new RuntimeException("Only admins and assigned theater managers can manage this theater");
        }
    }

    private void ensureAdminAuthorization(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Admin sign in is required");
        }
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        if (!Boolean.TRUE.equals(result)) {
            throw new RuntimeException("Only admins can manage cities");
        }
    }

    private String normalizeRequired(String value, String message) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private int nextCityId() {
        return cityDao.findAll().stream().map(City::getCityId).filter(id -> id != null).mapToInt(Integer::intValue).max().orElse(0) + 1;
    }

    private int nextSaloonId() {
        return saloonDao.findAll().stream().map(Saloon::getSaloonId).filter(id -> id != null).mapToInt(Integer::intValue).max().orElse(0) + 1;
    }

    private int nextShowtimeId() {
        return movieSaloonTimeDao.findAll().stream().map(MovieSaloonTime::getId).filter(id -> id != null).mapToInt(Integer::intValue).max().orElse(0) + 1;
    }
}
