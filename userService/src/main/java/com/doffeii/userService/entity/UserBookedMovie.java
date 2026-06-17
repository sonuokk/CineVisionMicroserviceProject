package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserBookedMovie {
    private String bookingCode;
    private MovieSnapshot movie;
    @Field("theaterName")
    private String saloonName;
    @Field("theaterDisplayName")
    private String theatreName;
    private String movieDay;
    private String movieStartTime;
    private String showtimeStartTime;
    private List<String> seats;
    private int adultTicketCount;
    private int studentTicketCount;
    private BigDecimal totalAmount;
    private Instant bookedAt;
    private String status;
    private Instant cancelledAt;
    private String qrCodePayload;
}
