package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.PaymentService;
import com.doffeii.movieService.entity.dto.CancelTicketRequestDto;
import com.doffeii.movieService.entity.dto.TicketBookingResponseDto;
import com.doffeii.movieService.entity.dto.TicketInformationDto;
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
    public TicketBookingResponseDto sendTicketDetail(@Valid @RequestBody TicketInformationDto ticketInformationDto,
                                                     @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return paymentService.sendTicketDetail(ticketInformationDto, authorizationHeader);
    }

    @PostMapping("cancel")
    public TicketBookingResponseDto cancelTicket(@Valid @RequestBody CancelTicketRequestDto cancelTicketRequestDto,
                                                @RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return paymentService.cancelTicket(cancelTicketRequestDto, authorizationHeader);
    }

    @GetMapping("bookedSeats")
    public List<String> getBookedSeats(@RequestParam String movieName,
                                       @RequestParam String saloonName,
                                       @RequestParam String movieDay,
                                       @RequestParam String movieStartTime) {
        return paymentService.getBookedSeats(movieName, saloonName, movieDay, movieStartTime);
    }

    @DeleteMapping("user-records")
    public void purgeUserRecords(@RequestParam String email,
                                 @RequestParam(required = false) String userId,
                                 @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
                                 @RequestHeader(value = "X-Internal-Cleanup-Token", required = false) String cleanupToken) {
        paymentService.purgeUserRecords(email, userId,
                authorizationHeader != null && !authorizationHeader.isBlank()
                        ? authorizationHeader
                        : cleanupToken == null ? null : "InternalCleanup " + cleanupToken);
    }
}
