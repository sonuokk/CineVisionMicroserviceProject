package com.doffeii.userService.config;

import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Instant;

@Component
@RequiredArgsConstructor
public class TheaterManagerRequestCleanup {

    private final UserDao userDao;
    private final RestTemplate restTemplate;

    @Value("${app.internal.cleanup-token:cinesaga-internal-cleanup-token}")
    private String cleanupToken;

    @Scheduled(initialDelayString = "${app.theater-manager.cleanup-initial-delay-ms:60000}",
            fixedDelayString = "${app.theater-manager.cleanup-delay-ms:3600000}")
    public void deleteExpiredRejectedManagerRequests() {
        userDao.findByTheaterManagerRequestStatusAndTheaterManagerDeleteAfterBefore("REJECTED", Instant.now())
                .forEach(this::deleteRejectedUser);
    }

    private void deleteRejectedUser(User user) {
        purgeMovieServiceRecords(user);
        userDao.delete(user);
    }

    private void purgeMovieServiceRecords(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        String purgeUrl = UriComponentsBuilder
                .fromUriString("http://MOVIESERVICE/api/movie/payments/user-records")
                .queryParam("email", user.getEmail())
                .queryParam("userId", user.getUserId())
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Cleanup-Token", cleanupToken);
        try {
            restTemplate.exchange(purgeUrl, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
        } catch (RuntimeException exception) {
            // Keep account cleanup moving even if movie-service is temporarily unavailable.
        }
    }
}
