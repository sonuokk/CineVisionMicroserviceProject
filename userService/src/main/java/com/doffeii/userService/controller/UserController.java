package com.doffeii.userService.controller;

import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.entity.dto.FavoriteMovieRequestDto;
import com.doffeii.userService.entity.dto.FavoriteTheaterRequestDto;
import com.doffeii.userService.entity.dto.NotificationPreferencesDto;
import com.doffeii.userService.entity.dto.PromoteUserRequestDto;
import com.doffeii.userService.entity.dto.UpdateUserProfileRequestDto;
import com.doffeii.userService.entity.dto.UserBookedMovieDto;
import com.doffeii.userService.entity.dto.UserProfileResponseDto;
import com.doffeii.userService.entity.dto.UserRegisterRequestDto;
import com.doffeii.userService.entity.dto.WalletTopUpRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/user/users/")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("isExist/{userId}")
    public boolean isExists(@PathVariable("userId") String userId) {
        return userService.isUserExist(userId);
    }

    @PostMapping("add")
    public UserProfileResponseDto addUser(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return userService.addUser(userRegisterRequestDto);
    }

    @GetMapping("admin/all")
    public List<UserProfileResponseDto> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping("admin/promote")
    public UserProfileResponseDto promoteUserToAdmin(@Valid @RequestBody PromoteUserRequestDto promoteUserRequestDto) {
        return userService.promoteUserToAdmin(promoteUserRequestDto.getEmail());
    }

    @GetMapping("me")
    public UserProfileResponseDto me() {
        return userService.getCurrentUserProfile();
    }

    @PutMapping("me")
    public UserProfileResponseDto updateMe(@Valid @RequestBody UpdateUserProfileRequestDto updateUserProfileRequestDto) {
        return userService.updateCurrentUserProfile(updateUserProfileRequestDto);
    }

    @PostMapping("me/booked-movies")
    public UserProfileResponseDto recordBookedMovie(@RequestBody UserBookedMovieDto userBookedMovieDto) {
        return userService.recordBookedMovie(userBookedMovieDto);
    }

    @PostMapping("me/booked-movies/{bookingCode}/cancel")
    public UserProfileResponseDto cancelBookedMovie(@PathVariable("bookingCode") String bookingCode) {
        return userService.cancelBookedMovie(bookingCode);
    }

    @PostMapping("me/favorites/movies")
    public UserProfileResponseDto addFavoriteMovie(@Valid @RequestBody FavoriteMovieRequestDto favoriteMovieRequestDto) {
        return userService.addFavoriteMovie(favoriteMovieRequestDto);
    }

    @DeleteMapping("me/favorites/movies/{movieId}")
    public UserProfileResponseDto removeFavoriteMovie(@PathVariable("movieId") int movieId) {
        return userService.removeFavoriteMovie(movieId);
    }

    @PostMapping("me/favorites/theaters")
    public UserProfileResponseDto addFavoriteTheater(@Valid @RequestBody FavoriteTheaterRequestDto favoriteTheaterRequestDto) {
        return userService.addFavoriteTheater(favoriteTheaterRequestDto);
    }

    @DeleteMapping("me/favorites/theaters/{theaterName}")
    public UserProfileResponseDto removeFavoriteTheater(@PathVariable("theaterName") String theaterName) {
        return userService.removeFavoriteTheater(theaterName);
    }

    @PostMapping("me/wallet/top-up")
    public UserProfileResponseDto topUpWallet(@Valid @RequestBody WalletTopUpRequestDto walletTopUpRequestDto) {
        return userService.topUpWallet(walletTopUpRequestDto);
    }

    @PutMapping("me/notifications")
    public UserProfileResponseDto updateNotificationPreferences(@RequestBody NotificationPreferencesDto notificationPreferencesDto) {
        return userService.updateNotificationPreferences(notificationPreferencesDto);
    }

    @GetMapping("isUserCustomer")
    public boolean isUserCustomer() {
        return userService.isUserCustomer();
    }
    @GetMapping("isUserAdmin")
    public boolean isUserAdmin() {
        return userService.isUserAdmin();
    }
}
