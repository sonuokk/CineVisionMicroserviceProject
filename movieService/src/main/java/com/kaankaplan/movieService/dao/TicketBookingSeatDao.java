package com.kaankaplan.movieService.dao;

import com.kaankaplan.movieService.entity.TicketBookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketBookingSeatDao extends JpaRepository<TicketBookingSeat, Long> {

    @Query("""
            select seat.seatNumber
            from TicketBookingSeat seat
            where seat.movieName = :movieName
              and seat.saloonName = :saloonName
              and seat.movieDay = :movieDay
              and seat.movieStartTime = :movieStartTime
            order by seat.seatNumber
            """)
    List<String> findBookedSeats(
            @Param("movieName") String movieName,
            @Param("saloonName") String saloonName,
            @Param("movieDay") String movieDay,
            @Param("movieStartTime") String movieStartTime
    );
}
