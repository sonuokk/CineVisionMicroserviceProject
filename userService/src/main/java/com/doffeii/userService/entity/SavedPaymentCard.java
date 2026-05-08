package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedPaymentCard {
    private String cardId;
    private String nickname;
    private String cardHolderName;
    private String cardNumber;
    private String maskedCardNumber;
    private String cardExpiry;
    private String cardBrand;
    private Instant createdAt;
}
