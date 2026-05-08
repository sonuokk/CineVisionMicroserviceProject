package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.MovieImageService;
import com.doffeii.movieService.business.abstracts.MovieService;
import com.doffeii.movieService.dao.MovieImageDao;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieImage;
import com.doffeii.movieService.entity.dto.ImageRequestDto;
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
            image.setImageId(nextImageId());
            image.setImageUrl(imageRequestDto.getImageUrl());
            image.setMovie(movie);

            return movieImageDao.save(image);
        }
        throw new RuntimeException("Yetki hatası");
    }

    private int nextImageId() {
        return movieImageDao.findAll().stream()
                .map(MovieImage::getImageId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }}