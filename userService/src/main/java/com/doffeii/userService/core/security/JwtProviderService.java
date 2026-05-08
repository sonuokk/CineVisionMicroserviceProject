package com.doffeii.userService.core.security;

import org.springframework.security.core.Authentication;

public interface JwtProviderService {

    String generateToken(Authentication authentication);
}
