package com.doffeii.userService.entity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.doffeii.userService.entity.FavoriteMovie;
import com.doffeii.userService.entity.FavoriteTheater;
import com.doffeii.userService.entity.WalletTransaction;
import com.doffeii.userService.entity.UserBookedMovie;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserProfileResponseDto {
    private String userId;
    private String email;
    private String fullName;
    private String phone;
    private String preferredCity;
    private String role;
    private boolean emailVerified;
    private boolean verified;
    private List<SavedPaymentCardDto> savedPaymentCards;
    private List<UserBookedMovie> bookedMovies;
    private List<FavoriteMovie> favoriteMovies;
    private List<FavoriteTheater> favoriteTheaters;
    private BigDecimal walletBalance;
    private List<WalletTransaction> walletTransactions;
    private NotificationPreferencesDto notificationPreferences;
}
