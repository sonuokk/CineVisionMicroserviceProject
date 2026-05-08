package com.doffeii.movieService.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TicketInformationDto {

    private int movieId;

    @NotBlank(message = "Movie name is required")
    private String movieName;

    @NotBlank(message = "Cinema is required")
    private String saloonName;

    @NotBlank(message = "Movie date is required")
    private String movieDay;

    @NotBlank(message = "Show time is required")
    private String movieStartTime;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String phone;

    @NotBlank(message = "Choose at least one seat")
    private String chairNumbers;

    @Min(value = 0, message = "Adult ticket count cannot be negative")
    private int adultTicketCount;

    @Min(value = 0, message = "Student ticket count cannot be negative")
    private int studentTicketCount;

    private String cardHolderName;

    private String cardNumber;

    private String cardExpiry;

    private String cardSecurityCode;

    private String paymentMode;

}
