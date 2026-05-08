package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "actorImages")
public class ActorImage {
    @Id
    private Integer imageId;
    private String imageUrl;
    private Actor actor;
}
