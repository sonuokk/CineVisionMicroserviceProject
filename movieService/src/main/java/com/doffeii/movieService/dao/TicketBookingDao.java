package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.TicketBooking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketBookingDao extends MongoRepository<TicketBooking, String> {
    TicketBooking findByBookingCode(String bookingCode);
    List<TicketBooking> findByEmailIgnoreCase(String email);
    List<TicketBooking> findByMovieNameIgnoreCase(String movieName);
    List<TicketBooking> findByMovieNameAndSaloonNameAndMovieDayAndMovieStartTimeAndStatusIgnoreCase(
            String movieName,
            String saloonName,
            String movieDay,
            String movieStartTime,
            String status
    );
}
