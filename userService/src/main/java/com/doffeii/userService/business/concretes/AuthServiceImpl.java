package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.AuthService;
import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.core.security.JwtProviderService;
import com.doffeii.userService.entity.User;
import com.doffeii.userService.entity.dto.UserAuthenticationResponseDto;
import com.doffeii.userService.entity.dto.UserLoginRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProviderService jwtProvider;
    private final UserService userService;

    @Override
    public UserAuthenticationResponseDto login(UserLoginRequestDto userLoginRequestDto) {
        String email = userLoginRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        Authentication authenticate = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                email,
                userLoginRequestDto.getPassword()
        ));

        SecurityContextHolder.getContext().setAuthentication(authenticate);
        String token = jwtProvider.generateToken(authenticate);

        User user = userService.getUserByEmail(email);

        return UserAuthenticationResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .token(token)
                .roles(authenticate.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                .build();
    }
}
