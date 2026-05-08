package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.MovieImage;
import com.doffeii.movieService.entity.dto.ImageRequestDto;


public interface MovieImageService {

    MovieImage addMovieImage(ImageRequestDto imageRequestDto);
}
