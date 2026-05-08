package com.doffeii.userService.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WalletTransaction {
    private String transactionId;
    private BigDecimal amount;
    private String type;
    private String description;
    private Instant createdAt;
}
