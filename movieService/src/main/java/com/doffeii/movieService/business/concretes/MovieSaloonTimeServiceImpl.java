package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.MovieSaloonTimeService;
import com.doffeii.movieService.dao.MovieSaloonTimeDao;
import com.doffeii.movieService.entity.MovieSaloonTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieSaloonTimeServiceImpl implements MovieSaloonTimeService {

    private final MovieSaloonTimeDao movieSaloonTimeDao;

    @Override
    public List<MovieSaloonTime> getMovieSaloonTimeSaloonAndMovieId(int saloonId, int movieId) {
        return movieSaloonTimeDao.getMovieSaloonTimeBySaloonSaloonIdAndMovieMovieId(saloonId, movieId);
    }
}
