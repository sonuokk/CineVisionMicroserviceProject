package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Document(collection = "reviews")
public class Comment {
    @Id
    private Integer commentId;
    private String commentText;
    private String commentBy;
    private String commentByUserId;
    private int rating;
    private Movie movie;
}
