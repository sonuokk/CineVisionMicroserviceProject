package com.doffeii.movieService.entity.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelTicketRequestDto {
    @NotBlank(message = "Booking code is required")
    private String bookingCode;
}
