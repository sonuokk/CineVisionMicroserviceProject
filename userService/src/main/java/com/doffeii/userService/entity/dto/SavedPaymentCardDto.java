package com.doffeii.userService.entity.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedPaymentCardDto {
    private String cardId;

    @Size(max = 40, message = "Card nickname cannot exceed 40 characters")
    private String nickname;

    @Size(max = 80, message = "Card holder name cannot exceed 80 characters")
    private String cardHolderName;

    @Size(max = 24, message = "Card number cannot exceed 24 characters")
    private String cardNumber;

    private String maskedCardNumber;

    @Size(max = 7, message = "Card expiry cannot exceed 7 characters")
    private String cardExpiry;

    @Size(max = 4, message = "CVV cannot exceed 4 digits")
    private String cardSecurityCode;

    private String cardBrand;
}
