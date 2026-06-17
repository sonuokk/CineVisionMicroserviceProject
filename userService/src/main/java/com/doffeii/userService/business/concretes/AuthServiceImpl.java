package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.AuthService;
import com.doffeii.userService.business.abstracts.RoleService;
import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.core.security.JwtProviderService;
import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.NotificationPreferences;
import com.doffeii.userService.entity.User;
import com.doffeii.userService.entity.dto.GoogleAuthRequestDto;
import com.doffeii.userService.entity.dto.UserAuthenticationResponseDto;
import com.doffeii.userService.entity.dto.UserLoginRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtProviderService jwtProvider;
    private final UserService userService;
    private final UserDao userDao;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    private final OtpEmailSender otpEmailSender;

    @Value("${app.google.client-id:}")
    private String googleClientId;

    @Override
    public UserAuthenticationResponseDto login(UserLoginRequestDto userLoginRequestDto) {
        String email = userLoginRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userService.getUserByEmail(email);
        ensureNotBlacklisted(user);

        Authentication authenticate = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                email,
                userLoginRequestDto.getPassword()
        ));

        SecurityContextHolder.getContext().setAuthentication(authenticate);
        String token = jwtProvider.generateToken(authenticate);
        List<String> roles = List.of(effectiveRoleName(user));

        return UserAuthenticationResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .token(token)
                .roles(roles)
                .theaterManagerRequestStatus(user.getTheaterManagerRequestStatus())
                .theaterManagerDeleteAfter(user.getTheaterManagerDeleteAfter())
                .theaterManagerRejectionReason(user.getTheaterManagerRejectionReason())
                .build();
    }

    @Override
    public UserAuthenticationResponseDto loginWithGoogle(GoogleAuthRequestDto googleAuthRequestDto) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google sign-in is not configured");
        }

        Map<?, ?> tokenInfo = fetchGoogleTokenInfo(googleAuthRequestDto.getCredential());
        String audience = stringValue(tokenInfo.get("aud"));
        String email = stringValue(tokenInfo.get("email")).trim().toLowerCase(Locale.ROOT);
        String emailVerified = stringValue(tokenInfo.get("email_verified"));
        String fullName = stringValue(tokenInfo.get("name"));
        String requestedRole = resolveGoogleRole(googleAuthRequestDto.getRole());
        boolean theaterManagerRequested = "THEATER_MANAGER".equals(requestedRole);
        List<String> requestedTheaters = resolveGoogleManagedTheaters(requestedRole, googleAuthRequestDto.getTheaterName());

        if (!googleClientId.equals(audience)) {
            throw new IllegalArgumentException("Google credential was issued for another client");
        }
        if (email.isBlank() || !"true".equalsIgnoreCase(emailVerified)) {
            throw new IllegalArgumentException("Google account email is not verified");
        }

        User user = userDao.findUserByEmail(email);
        boolean shouldNotifyAdmins = false;
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(fullName.isBlank() ? email.substring(0, email.indexOf("@")) : fullName)
                    .password(passwordEncoder.encode("GOOGLE-" + UUID.randomUUID()))
                    .emailVerified(true)
                    .role(roleService.getOrCreateRole(theaterManagerRequested ? "CUSTOMER" : requestedRole))
                    .managedTheaterNames(requestedTheaters)
                    .theaterManagerRequestStatus(theaterManagerRequested ? "PENDING" : "NONE")
                    .theaterManagerRequestedAt(theaterManagerRequested ? java.time.Instant.now() : null)
                    .savedPaymentCards(List.of())
                    .bookedMovies(List.of())
                    .favoriteMovies(List.of())
                    .favoriteTheaters(List.of())
                    .walletBalance(BigDecimal.ZERO)
                    .walletTransactions(List.of())
                    .notificationPreferences(defaultNotificationPreferences())
                    .build();
            user = userDao.insert(user);
            shouldNotifyAdmins = theaterManagerRequested;
        } else {
            if (!user.isEmailVerified()) {
                user.setEmailVerified(true);
            }
            if ((user.getFullName() == null || user.getFullName().isBlank()) && !fullName.isBlank()) {
                user.setFullName(fullName);
            }
            if (user.getRole() == null) {
                user.setRole(roleService.getOrCreateRole(theaterManagerRequested ? "CUSTOMER" : requestedRole));
            }
            if (theaterManagerRequested && !"APPROVED".equals(user.getTheaterManagerRequestStatus())) {
                shouldNotifyAdmins = !"PENDING".equals(user.getTheaterManagerRequestStatus());
                user.setRole(roleService.getOrCreateRole("CUSTOMER"));
                user.setManagedTheaterNames(requestedTheaters);
                user.setTheaterManagerRequestStatus("PENDING");
                user.setTheaterManagerRequestedAt(java.time.Instant.now());
                user.setTheaterManagerReviewedAt(null);
                user.setTheaterManagerRejectedAt(null);
                user.setTheaterManagerDeleteAfter(null);
                user.setTheaterManagerRejectionReason(null);
            }
            user = userDao.save(user);
        }

        if (shouldNotifyAdmins) {
            notifyAdminsOfTheaterManagerRequest(user);
        }

        ensureNotBlacklisted(user);

        List<SimpleGrantedAuthority> authorities = List.of(new SimpleGrantedAuthority(
                effectiveRoleName(user)
        ));
        Authentication authentication = new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = jwtProvider.generateToken(authentication);

        return UserAuthenticationResponseDto.builder()
                .userId(user.getUserId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .token(token)
                .roles(authorities.stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList()))
                .theaterManagerRequestStatus(user.getTheaterManagerRequestStatus())
                .theaterManagerDeleteAfter(user.getTheaterManagerDeleteAfter())
                .theaterManagerRejectionReason(user.getTheaterManagerRejectionReason())
                .build();
    }

    private Map<?, ?> fetchGoogleTokenInfo(String credential) {
        String url = UriComponentsBuilder
                .fromUriString("https://oauth2.googleapis.com/tokeninfo")
                .queryParam("id_token", credential)
                .toUriString();
        Map<?, ?> tokenInfo = new RestTemplate().getForObject(url, Map.class);
        if (tokenInfo == null || tokenInfo.isEmpty()) {
            throw new IllegalArgumentException("Google credential could not be verified");
        }
        return tokenInfo;
    }

    private NotificationPreferences defaultNotificationPreferences() {
        return NotificationPreferences.builder()
                .emailEnabled(true)
                .smsEnabled(false)
                .whatsappEnabled(false)
                .build();
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private void notifyAdminsOfTheaterManagerRequest(User requester) {
        userDao.findAll().stream()
                .filter(user -> user.isEmailVerified()
                        && user.getRole() != null
                        && user.getRole().getRoleName() != null
                        && ("ADMIN".equals(user.getRole().getRoleName()) || "ROLE_ADMIN".equals(user.getRole().getRoleName())))
                .forEach(admin -> java.util.concurrent.CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                        admin.getEmail(),
                        "New CineSaga theatre manager request",
                        (requester.getFullName() == null || requester.getFullName().isBlank()
                                ? requester.getEmail()
                                : requester.getFullName()) + " requested theatre manager access. Review the request in Manage Users."
                )).exceptionally(exception -> null));
    }

    private void ensureNotBlacklisted(User user) {
        if (user == null || user.getBlacklistedAt() == null) {
            return;
        }
        if (user.getBlacklistedUntil() == null || user.getBlacklistedUntil().isAfter(java.time.Instant.now())) {
            String period = user.getBlacklistedUntil() == null
                    ? "permanently"
                    : "until " + user.getBlacklistedUntil();
            throw new IllegalArgumentException("Your CineSaga account is blacklisted " + period + ".");
        }
    }

    private String resolveGoogleRole(String requestedRole) {
        if (requestedRole == null || requestedRole.isBlank()) {
            return "CUSTOMER";
        }
        String normalizedRole = requestedRole.trim().toUpperCase(Locale.ROOT).replace("ROLE_", "");
        if ("THEATRE_MANAGER".equals(normalizedRole) || "THEATER_MANAGER".equals(normalizedRole)) {
            return "THEATER_MANAGER";
        }
        return "CUSTOMER";
    }

    private String effectiveRoleName(User user) {
        String roleName = user == null || user.getRole() == null || user.getRole().getRoleName() == null
                ? "CUSTOMER"
                : user.getRole().getRoleName();
        if ("THEATER_MANAGER".equals(roleName) && !"APPROVED".equals(user.getTheaterManagerRequestStatus())) {
            return "CUSTOMER";
        }
        return roleName;
    }

    private List<String> resolveGoogleManagedTheaters(String role, String theaterName) {
        if (!"THEATER_MANAGER".equals(role)) {
            return List.of();
        }
        String normalizedTheaterName = theaterName == null ? "" : theaterName.trim();
        if (normalizedTheaterName.isBlank()) {
            throw new IllegalArgumentException("Choose an assigned theatre for theater manager registration");
        }
        return List.of(normalizedTheaterName.split(",")).stream()
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .distinct()
                .toList();
    }

}
