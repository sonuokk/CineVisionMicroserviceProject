package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.dto.TicketBookingResponseDto;
import com.doffeii.movieService.entity.dto.CancelTicketRequestDto;
import com.doffeii.movieService.entity.dto.TicketInformationDto;

import java.util.List;

public interface PaymentService {

    TicketBookingResponseDto sendTicketDetail(TicketInformationDto ticketInformationDto, String authorizationHeader);

    TicketBookingResponseDto cancelTicket(CancelTicketRequestDto cancelTicketRequestDto, String authorizationHeader);

    List<String> getBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime);

    void purgeUserRecords(String email, String userId, String authorizationHeader);
}
