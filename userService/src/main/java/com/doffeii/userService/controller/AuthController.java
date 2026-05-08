package com.doffeii.userService.controller;

import com.doffeii.userService.business.abstracts.AuthService;
import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.entity.dto.OtpRequestResponseDto;
import com.doffeii.userService.entity.dto.PasswordResetConfirmRequestDto;
import com.doffeii.userService.entity.dto.PasswordResetRequestDto;
import com.doffeii.userService.entity.dto.UserAuthenticationResponseDto;
import com.doffeii.userService.entity.dto.UserLoginRequestDto;
import com.doffeii.userService.entity.dto.UserProfileResponseDto;
import com.doffeii.userService.entity.dto.UserRegisterRequestDto;
import com.doffeii.userService.entity.dto.VerifyRegistrationOtpRequestDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @PostMapping({"/register", "/signup"})
    public OtpRequestResponseDto register(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return userService.requestRegistrationOtp(userRegisterRequestDto);
    }

    @PostMapping({"/register/request-otp", "/signup/request-otp"})
    public OtpRequestResponseDto requestRegistrationOtp(@Valid @RequestBody UserRegisterRequestDto userRegisterRequestDto) {
        return userService.requestRegistrationOtp(userRegisterRequestDto);
    }

    @PostMapping({"/register/verify-otp", "/signup/verify-otp"})
    public UserProfileResponseDto verifyRegistrationOtp(@Valid @RequestBody VerifyRegistrationOtpRequestDto verifyRegistrationOtpRequestDto) {
        return userService.verifyRegistrationOtp(verifyRegistrationOtpRequestDto);
    }

    @PostMapping({"/password/forgot", "/forgot-password"})
    public OtpRequestResponseDto requestPasswordResetOtp(@Valid @RequestBody PasswordResetRequestDto passwordResetRequestDto) {
        return userService.requestPasswordResetOtp(passwordResetRequestDto);
    }

    @PostMapping({"/password/reset", "/reset-password"})
    public OtpRequestResponseDto resetPassword(@Valid @RequestBody PasswordResetConfirmRequestDto passwordResetConfirmRequestDto) {
        return userService.resetPassword(passwordResetConfirmRequestDto);
    }

    @PostMapping("/login")
    public UserAuthenticationResponseDto login(@Valid @RequestBody UserLoginRequestDto userLoginRequestDto) {
        return authService.login(userLoginRequestDto);
    }
}
