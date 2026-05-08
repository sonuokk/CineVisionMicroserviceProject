package com.doffeii.movieService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TicketBookingResponseDto {
    private String status;
    private String message;
    private String bookingCode;
    private String movieName;
    private String saloonName;
    private String movieDay;
    private String movieStartTime;
    private String chairNumbers;
    private String totalAmount;
    private String qrCodePayload;
    private String cancelledAt;
}
