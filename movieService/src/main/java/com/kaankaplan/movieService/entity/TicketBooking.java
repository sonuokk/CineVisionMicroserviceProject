package com.kaankaplan.movieService.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "ticket_booking")
public class TicketBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TicketBookingSeat> seats = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (bookingCode == null) {
            bookingCode = "CV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public void addSeat(TicketBookingSeat seat) {
        seat.setBooking(this);
        seats.add(seat);
    }
}
