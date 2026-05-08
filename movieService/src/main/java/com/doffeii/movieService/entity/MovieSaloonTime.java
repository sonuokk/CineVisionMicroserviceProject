package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "showtimes")
public class MovieSaloonTime {
    @Id
    private Integer id;
    private String movieBeginTime;
    private Saloon saloon;
    private Movie movie;
}
