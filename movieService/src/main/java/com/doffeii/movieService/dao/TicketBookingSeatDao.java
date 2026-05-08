package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.TicketBookingSeat;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TicketBookingSeatDao extends MongoRepository<TicketBookingSeat, String> {
    List<TicketBookingSeat> findByMovieNameAndSaloonNameAndMovieDayAndMovieStartTimeOrderBySeatNumberAsc(
            String movieName,
            String saloonName,
            String movieDay,
            String movieStartTime
    );

    default List<String> findBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime) {
        return findByMovieNameAndSaloonNameAndMovieDayAndMovieStartTimeOrderBySeatNumberAsc(
                movieName, saloonName, movieDay, movieStartTime
        ).stream().map(TicketBookingSeat::getSeatNumber).toList();
    }
}
