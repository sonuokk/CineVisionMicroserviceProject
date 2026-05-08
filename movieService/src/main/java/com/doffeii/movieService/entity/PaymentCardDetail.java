package com.doffeii.movieService.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "payments")
public class PaymentCardDetail {
    @Id
    private String paymentCode;
    private BigDecimal amount;
    private String paymentMode;
    private String status;
    private String cardHolderName;
    private String maskedCardNumber;
    private String cardNumberHash;
    private String cardExpiry;
    private String cardBrand;
    private Instant createdAt;
    private Instant refundedAt;
    private TicketBooking booking;
}
