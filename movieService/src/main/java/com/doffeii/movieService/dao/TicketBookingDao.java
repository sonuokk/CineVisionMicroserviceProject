package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.TicketBooking;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface TicketBookingDao extends MongoRepository<TicketBooking, String> {
    TicketBooking findByBookingCode(String bookingCode);
}
