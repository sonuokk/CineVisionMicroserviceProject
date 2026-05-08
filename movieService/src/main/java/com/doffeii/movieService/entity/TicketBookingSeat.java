package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "bookingSeats")
public class TicketBookingSeat {
    @Id
    private String id;
    private String movieName;
    private String saloonName;
    private String movieDay;
    private String movieStartTime;
    private String seatNumber;
    private String bookingCode;
}
