package com.doffeii.movieService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;
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
    @Field("theaters")
    private List<Saloon> theaters;
    private Movie movie;

    @JsonIgnore
    public List<Saloon> getSaloon() {
        return theaters;
    }

    public void setSaloon(List<Saloon> saloon) {
        this.theaters = saloon;
    }
}
