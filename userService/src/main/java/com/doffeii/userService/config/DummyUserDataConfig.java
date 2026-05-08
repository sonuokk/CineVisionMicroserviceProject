package com.doffeii.userService.config;

import com.doffeii.userService.business.abstracts.ClaimService;
import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.NotificationPreferences;
import com.doffeii.userService.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Configuration
@RequiredArgsConstructor
public class DummyUserDataConfig {

    private final UserDao userDao;
    private final ClaimService claimService;
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner dummyVerifiedUsersRunner() {
        return args -> List.of(
                dummyUser("aarav.mehra@example.com", "Aarav Mehra", "Mumbai"),
                dummyUser("riya.sen@example.com", "Riya Sen", "Delhi"),
                dummyUser("kabir.roy@example.com", "Kabir Roy", "Bengaluru"),
                dummyUser("naina.shah@example.com", "Naina Shah", "Pune"),
                dummyUser("dev.patel@example.com", "Dev Patel", "Hyderabad")
        ).forEach(user -> {
            if (userDao.findUserByEmail(user.getEmail()) == null) {
                userDao.save(user);
            }
        });
    }

    private User dummyUser(String email, String fullName, String preferredCity) {
        return User.builder()
                .email(email.trim().toLowerCase(Locale.ROOT))
                .password(passwordEncoder.encode("User@12345"))
                .fullName(fullName)
                .phone("+91" + String.format("%010d", Math.abs(email.hashCode()) % 1_000_000_000))
                .preferredCity(preferredCity)
                .savedPaymentCards(List.of())
                .bookedMovies(List.of())
                .favoriteMovies(List.of())
                .favoriteTheaters(List.of())
                .walletBalance(BigDecimal.valueOf(1500))
                .walletTransactions(List.of())
                .notificationPreferences(NotificationPreferences.builder()
                        .emailEnabled(true)
                        .smsEnabled(true)
                        .whatsappEnabled(true)
                        .build())
                .emailVerified(true)
                .claim(claimService.getOrCreateClaim("CUSTOMER"))
                .registrationOtpAttempts(0)
                .build();
    }
}
