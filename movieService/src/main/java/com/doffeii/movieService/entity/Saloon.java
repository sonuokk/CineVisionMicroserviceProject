package com.doffeii.movieService.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "theatres")
public class Saloon {
    @Id
    private Integer theaterId;
    private String theaterName;
    private City city;
    @Transient
    private List<String> showtimes;

    public Saloon(Integer theaterId, String theaterName, City city) {
        this.theaterId = theaterId;
        this.theaterName = theaterName;
        this.city = city;
    }

    @JsonIgnore
    public Integer getSaloonId() {
        return theaterId;
    }

    public void setSaloonId(Integer saloonId) {
        this.theaterId = saloonId;
    }

    @JsonIgnore
    public String getSaloonName() {
        return theaterName;
    }

    public void setSaloonName(String saloonName) {
        this.theaterName = saloonName;
    }
}
