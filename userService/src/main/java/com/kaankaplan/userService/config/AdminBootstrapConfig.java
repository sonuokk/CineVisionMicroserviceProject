package com.kaankaplan.userService.config;

import com.kaankaplan.userService.business.abstracts.ClaimService;
import com.kaankaplan.userService.dao.UserDao;
import com.kaankaplan.userService.entity.Claim;
import com.kaankaplan.userService.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;

@Configuration
@RequiredArgsConstructor
public class AdminBootstrapConfig {

    private final UserDao userDao;
    private final ClaimService claimService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.bootstrap.email:admin@cinesaga.local}")
    private String adminEmail;

    @Value("${app.admin.bootstrap.password:Admin@12345}")
    private String adminPassword;

    @Value("${app.admin.bootstrap.full-name:CineSaga Admin}")
    private String adminFullName;

    @Bean
    public CommandLineRunner bootstrapAdminUser() {
        return args -> {
            String email = adminEmail.trim().toLowerCase(Locale.ROOT);
            if (email.isBlank() || userDao.findUserByEmail(email) != null) {
                return;
            }

            Claim adminClaim = claimService.getOrCreateClaim("ADMIN");
            User admin = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminFullName)
                    .claim(adminClaim)
                    .build();

            userDao.insert(admin);
        };
    }
}
