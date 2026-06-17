package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Field;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketBookingSeat {
    @Id
    private String id;
    private String movieName;
    @Field("theaterName")
    private String saloonName;
    private String movieDay;
    private String movieStartTime;
    private String seatNumber;
    private String bookingCode;
}
