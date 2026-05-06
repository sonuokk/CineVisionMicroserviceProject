package com.kaankaplan.movieService.controller;

import com.kaankaplan.movieService.business.abstracts.PaymentService;
import com.kaankaplan.movieService.entity.dto.TicketBookingResponseDto;
import com.kaankaplan.movieService.entity.dto.TicketInformationDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/movie/payments/")
@RequiredArgsConstructor
//@CrossOrigin
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("sendTicketDetail")
    public TicketBookingResponseDto sendTicketDetail(@Valid @RequestBody TicketInformationDto ticketInformationDto) {
        return paymentService.sendTicketDetail(ticketInformationDto);
    }

    @GetMapping("bookedSeats")
    public List<String> getBookedSeats(@RequestParam String movieName,
                                       @RequestParam String saloonName,
                                       @RequestParam String movieDay,
                                       @RequestParam String movieStartTime) {
        return paymentService.getBookedSeats(movieName, saloonName, movieDay, movieStartTime);
    }
}
