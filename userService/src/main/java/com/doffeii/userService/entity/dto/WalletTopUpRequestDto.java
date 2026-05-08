package com.doffeii.userService.entity.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTopUpRequestDto {
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "1.00", message = "Wallet top-up must be at least 1.00")
    private BigDecimal amount;

    private String description;
}
