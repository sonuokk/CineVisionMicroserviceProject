package com.doffeii.userService.entity;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Field;
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
    private String profileImageUrl;
    private List<SavedPaymentCard> savedPaymentCards;
    private List<UserBookedMovie> bookedMovies;
    private List<FavoriteMovie> favoriteMovies;
    private List<FavoriteTheater> favoriteTheaters;
    private List<String> managedTheaterNames;
    private BigDecimal walletBalance;
    private List<WalletTransaction> walletTransactions;
    private NotificationPreferences notificationPreferences;
    private boolean emailVerified;
    private Instant blacklistedUntil;
    private Instant blacklistedAt;
    private String blacklistReason;
    private String theaterManagerRequestStatus;
    private Instant theaterManagerRequestedAt;
    private Instant theaterManagerReviewedAt;
    private Instant theaterManagerRejectedAt;
    private Instant theaterManagerDeleteAfter;
    private String theaterManagerRejectionReason;
    @Field("role")
    private Role role;
    private String registrationOtpHash;
    private Instant registrationOtpCreatedAt;
    private Instant registrationOtpExpiresAt;
    private int registrationOtpAttempts;
}
