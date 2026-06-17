package com.doffeii.movieService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "showtimes")
public class MovieSaloonTime {
    @Id
    private Integer id;
    private String movieBeginTime;
    @Field("theater")
    private Saloon theater;
    private Movie movie;

    @JsonIgnore
    public Saloon getSaloon() {
        return theater;
    }

    public void setSaloon(Saloon saloon) {
        this.theater = saloon;
    }
}
