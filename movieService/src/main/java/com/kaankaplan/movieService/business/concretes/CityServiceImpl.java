package com.kaankaplan.movieService.business.concretes;

import com.kaankaplan.movieService.business.abstracts.CityService;
import com.kaankaplan.movieService.business.abstracts.MovieService;
import com.kaankaplan.movieService.dao.CityDao;
import com.kaankaplan.movieService.dao.MovieSaloonTimeDao;
import com.kaankaplan.movieService.dao.SaloonDao;
import com.kaankaplan.movieService.entity.City;
import com.kaankaplan.movieService.entity.Movie;
import com.kaankaplan.movieService.entity.MovieSaloonTime;
import com.kaankaplan.movieService.entity.Saloon;
import com.kaankaplan.movieService.entity.dto.CityRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

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
        return cityDao.getCitiesByMovieMovieId(movieId);
    }

    @Cacheable(value = "cities")
    @Override
    public List<City> getall() {
        return cityDao.findAll(Sort.by(Sort.Direction.ASC, "cityName"));
    }

    @CacheEvict(value = "cities", allEntries = true)
    @Override
    public void add(CityRequestDto cityRequestDto) {
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + cityRequestDto.getToken())
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();
        if (result) {
            Movie movie = movieService.getMovieById(cityRequestDto.getMovieId());
            for (String cityName: cityRequestDto.getCityNameList()) {
                City city = City.builder()
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

    private void createDefaultSaloonsAndTimes(City city, Movie movie) {
        for (int screenNumber = 1; screenNumber <= 2; screenNumber++) {
            Saloon saloon = new Saloon();
            saloon.setCity(city);
            saloon.setSaloonName(city.getCityName() + " CineSaga Screen " + screenNumber);
            Saloon savedSaloon = saloonDao.save(saloon);

            for (String showTime : DEFAULT_SHOW_TIMES) {
                MovieSaloonTime movieSaloonTime = new MovieSaloonTime();
                movieSaloonTime.setMovie(movie);
                movieSaloonTime.setSaloon(savedSaloon);
                movieSaloonTime.setMovieBeginTime(showTime);
                movieSaloonTimeDao.save(movieSaloonTime);
            }
        }
    }
}
