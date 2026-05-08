package com.doffeii.userService.business.abstracts;

import com.doffeii.userService.entity.dto.UserAuthenticationResponseDto;
import com.doffeii.userService.entity.dto.UserLoginRequestDto;

public interface AuthService {

    UserAuthenticationResponseDto login(UserLoginRequestDto userLoginRequestDto);
}
