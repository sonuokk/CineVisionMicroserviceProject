package com.doffeii.movieService.entity.mongo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "movieSnapshots")
public class MovieDocument {
    @Id
    private String id;

    private int movieId;
    private String movieName;
    private String description;
    private int duration;
    private Date releaseDate;
    private boolean display;
    private int categoryId;
    private String categoryName;
    private String movieImageUrl;
    private String movieTrailerUrl;
    private String directorName;
    private Instant syncedAt;
}
