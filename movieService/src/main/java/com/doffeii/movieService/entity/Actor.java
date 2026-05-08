package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "actors")
@Builder
public class Actor implements Serializable {
    @Id
    private Integer actorId;
    private String actorName;
    private Movie movie;
    private ActorImage actorImage;
}
