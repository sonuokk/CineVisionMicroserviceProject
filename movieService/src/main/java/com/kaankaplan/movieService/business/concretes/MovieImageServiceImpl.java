package com.kaankaplan.movieService.business.concretes;

import com.kaankaplan.movieService.business.abstracts.MovieImageService;
import com.kaankaplan.movieService.business.abstracts.MovieService;
import com.kaankaplan.movieService.dao.MovieImageDao;
import com.kaankaplan.movieService.entity.Movie;
import com.kaankaplan.movieService.entity.MovieImage;
import com.kaankaplan.movieService.entity.dto.ImageRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;


@Service
@RequiredArgsConstructor
public class MovieImageServiceImpl implements MovieImageService {

    private final MovieImageDao movieImageDao;
    private final MovieService movieService;
    private final WebClient.Builder webClientBuilder;


    @Override
    @CacheEvict(value = {"displaying_movies", "comingSoon_movies"}, allEntries = true)
    public MovieImage addMovieImage(ImageRequestDto imageRequestDto) {

        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + imageRequestDto.getToken())
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();

        if (result) {
            Movie movie = movieService.getMovieById(imageRequestDto.getMovieId());

            MovieImage image = new MovieImage();
            image.setImageUrl(imageRequestDto.getImageUrl());
            image.setMovie(movie);

            return movieImageDao.save(image);
        }
        throw new RuntimeException("Yetki hatası");
    }
}
