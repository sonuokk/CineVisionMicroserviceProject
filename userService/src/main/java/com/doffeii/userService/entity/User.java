package com.doffeii.userService.entity;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.math.BigDecimal;
import java.util.List;

@Data
@Document(collection = "users")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String userId;
    @Indexed(unique = true)
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String preferredCity;
    private List<SavedPaymentCard> savedPaymentCards;
    private List<UserBookedMovie> bookedMovies;
    private List<FavoriteMovie> favoriteMovies;
    private List<FavoriteTheater> favoriteTheaters;
    private BigDecimal walletBalance;
    private List<WalletTransaction> walletTransactions;
    private NotificationPreferences notificationPreferences;
    private boolean emailVerified;
    private Claim claim;
    private String registrationOtpHash;
    private Instant registrationOtpCreatedAt;
    private Instant registrationOtpExpiresAt;
    private int registrationOtpAttempts;
}
