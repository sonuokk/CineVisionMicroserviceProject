package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "cities")
@Builder
public class City implements Serializable {
    @Id
    private Integer cityId;
    private String cityName;
    private List<Saloon> saloon;
    private Movie movie;
}
