package com.kaankaplan.userService.business.abstracts;

import com.kaankaplan.userService.entity.User;
import com.kaankaplan.userService.entity.dto.AdminRegisterRequestDto;
import com.kaankaplan.userService.entity.dto.OtpRequestResponseDto;
import com.kaankaplan.userService.entity.dto.UserProfileResponseDto;
import com.kaankaplan.userService.entity.dto.UserRegisterRequestDto;
import com.kaankaplan.userService.entity.dto.VerifyRegistrationOtpRequestDto;

import java.util.List;

public interface UserService {

    Boolean isUserExist(String userId);

    UserProfileResponseDto addUser(UserRegisterRequestDto userRegisterRequestDto);

    OtpRequestResponseDto requestRegistrationOtp(UserRegisterRequestDto userRegisterRequestDto);

    UserProfileResponseDto verifyRegistrationOtp(VerifyRegistrationOtpRequestDto verifyRegistrationOtpRequestDto);

    UserProfileResponseDto addAdmin(AdminRegisterRequestDto adminRegisterRequestDto);

    UserProfileResponseDto promoteUserToAdmin(String email);

    List<UserProfileResponseDto> getAllUsers();

    User getUserByEmail(String email);

    UserProfileResponseDto getCurrentUserProfile();

    boolean isUserCustomer();

    boolean isUserAdmin();
}
