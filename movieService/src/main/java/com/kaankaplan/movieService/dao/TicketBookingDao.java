package com.kaankaplan.movieService.dao;

import com.kaankaplan.movieService.entity.TicketBooking;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketBookingDao extends JpaRepository<TicketBooking, Long> {
    TicketBooking findByBookingCode(String bookingCode);
}
