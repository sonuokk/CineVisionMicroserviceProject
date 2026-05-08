package com.doffeii.userService.business.abstracts;

import com.doffeii.userService.entity.User;
import com.doffeii.userService.entity.dto.OtpRequestResponseDto;
import com.doffeii.userService.entity.dto.FavoriteMovieRequestDto;
import com.doffeii.userService.entity.dto.FavoriteTheaterRequestDto;
import com.doffeii.userService.entity.dto.NotificationPreferencesDto;
import com.doffeii.userService.entity.dto.UpdateUserProfileRequestDto;
import com.doffeii.userService.entity.dto.PasswordResetConfirmRequestDto;
import com.doffeii.userService.entity.dto.PasswordResetRequestDto;
import com.doffeii.userService.entity.dto.UserBookedMovieDto;
import com.doffeii.userService.entity.dto.UserProfileResponseDto;
import com.doffeii.userService.entity.dto.UserRegisterRequestDto;
import com.doffeii.userService.entity.dto.VerifyRegistrationOtpRequestDto;
import com.doffeii.userService.entity.dto.WalletTopUpRequestDto;

import java.util.List;

public interface UserService {

    Boolean isUserExist(String userId);

    UserProfileResponseDto addUser(UserRegisterRequestDto userRegisterRequestDto);

    OtpRequestResponseDto requestRegistrationOtp(UserRegisterRequestDto userRegisterRequestDto);

    UserProfileResponseDto verifyRegistrationOtp(VerifyRegistrationOtpRequestDto verifyRegistrationOtpRequestDto);

    OtpRequestResponseDto requestPasswordResetOtp(PasswordResetRequestDto passwordResetRequestDto);

    OtpRequestResponseDto resetPassword(PasswordResetConfirmRequestDto passwordResetConfirmRequestDto);

    UserProfileResponseDto promoteUserToAdmin(String email);

    List<UserProfileResponseDto> getAllUsers();

    User getUserByEmail(String email);

    UserProfileResponseDto getCurrentUserProfile();

    UserProfileResponseDto updateCurrentUserProfile(UpdateUserProfileRequestDto updateUserProfileRequestDto);

    UserProfileResponseDto recordBookedMovie(UserBookedMovieDto userBookedMovieDto);

    UserProfileResponseDto cancelBookedMovie(String bookingCode);

    UserProfileResponseDto addFavoriteMovie(FavoriteMovieRequestDto favoriteMovieRequestDto);

    UserProfileResponseDto removeFavoriteMovie(int movieId);

    UserProfileResponseDto addFavoriteTheater(FavoriteTheaterRequestDto favoriteTheaterRequestDto);

    UserProfileResponseDto removeFavoriteTheater(String theaterName);

    UserProfileResponseDto topUpWallet(WalletTopUpRequestDto walletTopUpRequestDto);

    UserProfileResponseDto updateNotificationPreferences(NotificationPreferencesDto notificationPreferencesDto);

    boolean isUserCustomer();

    boolean isUserAdmin();
}
