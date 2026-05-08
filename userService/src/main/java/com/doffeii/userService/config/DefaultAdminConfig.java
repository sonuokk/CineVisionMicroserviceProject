package com.doffeii.userService.config;

import com.doffeii.userService.business.abstracts.ClaimService;
import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Configuration
@RequiredArgsConstructor
public class DefaultAdminConfig {

    private final UserDao userDao;
    private final ClaimService claimService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@cinesaga.local}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@12345}")
    private String adminPassword;

    @Value("${app.admin.full-name:CineSaga Admin}")
    private String adminFullName;

    @Bean
    CommandLineRunner defaultAdminRunner() {
        return args -> {
            String email = adminEmail.trim().toLowerCase(Locale.ROOT);
            User existingAdmin = userDao.findUserByEmail(email);
            if (existingAdmin != null) {
                existingAdmin.setEmailVerified(true);
                existingAdmin.setClaim(claimService.getOrCreateClaim("ADMIN"));
                userDao.save(existingAdmin);
                return;
            }

            userDao.save(User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .emailVerified(true)
                    .claim(claimService.getOrCreateClaim("ADMIN"))
                    .savedPaymentCards(List.of())
                    .bookedMovies(List.of())
                    .favoriteMovies(List.of())
                    .favoriteTheaters(List.of())
                    .walletBalance(BigDecimal.ZERO)
                    .walletTransactions(List.of())
                    .build());
        };
    }
}
