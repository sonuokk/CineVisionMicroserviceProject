package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "bookings")
public class TicketBooking {
    @Id
    private String bookingCode;
    private String movieName;
    private String saloonName;
    private String movieDay;
    private String movieStartTime;
    private String email;
    private String fullName;
    private String phone;
    private int adultTicketCount;
    private int studentTicketCount;
    private BigDecimal totalAmount;
    private String status;
    private Instant createdAt;
    private Instant cancelledAt;
    private List<TicketBookingSeat> seats = new ArrayList<>();

    public void ensureBookingMetadata() {
        if (bookingCode == null) {
            bookingCode = "CV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void addSeat(TicketBookingSeat seat) {
        seat.setId(this.bookingCode + "-" + seat.getSeatNumber());
        seat.setBookingCode(this.bookingCode);
        seats.add(seat);
    }
}
