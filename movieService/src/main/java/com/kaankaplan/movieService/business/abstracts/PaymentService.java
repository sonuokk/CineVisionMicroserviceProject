package com.kaankaplan.movieService.business.abstracts;

import com.kaankaplan.movieService.entity.dto.TicketBookingResponseDto;
import com.kaankaplan.movieService.entity.dto.TicketInformationDto;

import java.util.List;

public interface PaymentService {

    TicketBookingResponseDto sendTicketDetail(TicketInformationDto ticketInformationDto);

    List<String> getBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime);
}
