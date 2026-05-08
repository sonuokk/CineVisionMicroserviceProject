package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "movies")
@Builder
public class Movie {
    @Id
    private Integer movieId;
    private String movieName;
    private String description;
    private int duration;
    private Date releaseDate;
    private boolean isDisplay;
    private String movieTrailerUrl;
    private Category category;
    private MovieImage image;
    private Director director;
    private List<Actor> actors;
    private List<City> cities;
    private List<Comment> comments;
}
