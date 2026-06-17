package com.doffeii.movieService.config;

import com.doffeii.movieService.dao.CityDao;
import com.doffeii.movieService.dao.MovieDao;
import com.doffeii.movieService.dao.MovieSaloonTimeDao;
import com.doffeii.movieService.dao.SaloonDao;
import com.doffeii.movieService.entity.City;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieSaloonTime;
import com.doffeii.movieService.entity.Saloon;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class CityTheaterDataConfig {

    private final MovieDao movieDao;
    private final CityDao cityDao;
    private final SaloonDao saloonDao;
    private final MovieSaloonTimeDao movieSaloonTimeDao;

    private static final Map<String, List<String>> THEATERS_BY_CITY = Map.of(
            "Mumbai", List.of("CineSaga Bandra Luxe", "CineSaga Lower Parel", "CineSaga Juhu Prime"),
            "Delhi", List.of("CineSaga Connaught Place", "CineSaga Saket Select", "CineSaga Dwarka Grand"),
            "Bengaluru", List.of("CineSaga Orion Mall", "CineSaga Indiranagar", "CineSaga Whitefield"),
            "Pune", List.of("CineSaga Pavilion", "CineSaga Kalyani Nagar", "CineSaga Hinjewadi"),
            "Hyderabad", List.of("CineSaga Atrium", "CineSaga Banjara Hills", "CineSaga Hitech City")
    );

    private static final List<String> DEFAULT_SHOW_TIMES = List.of("10:30", "13:45", "17:00", "20:15", "22:40");

    @Bean
    @ConditionalOnProperty(prefix = "app.bootstrap.theaters", name = "enabled", havingValue = "true")
    public CommandLineRunner bootstrapCitiesAndTheaters() {
        return args -> movieDao.findAll().forEach(this::ensureCitiesAndTheaters);
    }

    private void ensureCitiesAndTheaters(Movie movie) {
        THEATERS_BY_CITY.forEach((cityName, theaterNames) -> {
            City city = cityDao.findFirstByMovieMovieIdAndCityNameIgnoreCase(movie.getMovieId(), cityName)
                    .orElseGet(() -> cityDao.save(City.builder()
                            .cityName(cityName)
                            .movie(movie)
                            .build()));

            theaterNames.forEach(theaterName -> {
                Saloon saloon = saloonDao.findFirstByCityCityIdAndTheaterNameIgnoreCase(city.getCityId(), theaterName)
                        .orElseGet(() -> {
                            Saloon newSaloon = new Saloon();
                            newSaloon.setCity(city);
                            newSaloon.setSaloonName(theaterName);
                            return saloonDao.save(newSaloon);
                        });

                DEFAULT_SHOW_TIMES.forEach(showTime -> ensureShowTime(movie, saloon, showTime));
            });
        });
    }

    private void ensureShowTime(Movie movie, Saloon saloon, String showTime) {
        if (movieSaloonTimeDao.existsByTheaterTheaterIdAndMovieMovieIdAndMovieBeginTime(
                saloon.getSaloonId(), movie.getMovieId(), showTime)) {
            return;
        }

        MovieSaloonTime movieSaloonTime = new MovieSaloonTime();
        movieSaloonTime.setMovie(movie);
        movieSaloonTime.setSaloon(saloon);
        movieSaloonTime.setMovieBeginTime(showTime);
        movieSaloonTimeDao.save(movieSaloonTime);
    }
}
