package com.doffeii.movieService.entity.mongo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookingSnapshots")
public class BookingDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String bookingCode;
    private String userEmail;
    private String fullName;
    private String phone;
    private MovieDocument movie;
    private String saloonName;
    private String theatreName;
    private String movieDay;
    private String movieStartTime;
    private String showtimeStartTime;
    private List<String> seats;
    private int adultTicketCount;
    private int studentTicketCount;
    private BigDecimal totalAmount;
    private String status;
    private Instant bookedAt;
    private Instant cancelledAt;
    private String qrCodePayload;
}
