package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.ClaimService;
import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.Claim;
import com.doffeii.userService.entity.FavoriteMovie;
import com.doffeii.userService.entity.FavoriteTheater;
import com.doffeii.userService.entity.NotificationPreferences;
import com.doffeii.userService.entity.SavedPaymentCard;
import com.doffeii.userService.entity.User;
import com.doffeii.userService.entity.UserBookedMovie;
import com.doffeii.userService.entity.WalletTransaction;
import com.doffeii.userService.entity.dto.FavoriteMovieRequestDto;
import com.doffeii.userService.entity.dto.FavoriteTheaterRequestDto;
import com.doffeii.userService.entity.dto.NotificationPreferencesDto;
import com.doffeii.userService.entity.dto.OtpRequestResponseDto;
import com.doffeii.userService.entity.dto.PasswordResetConfirmRequestDto;
import com.doffeii.userService.entity.dto.PasswordResetRequestDto;
import com.doffeii.userService.entity.dto.SavedPaymentCardDto;
import com.doffeii.userService.entity.dto.UpdateUserProfileRequestDto;
import com.doffeii.userService.entity.dto.UserBookedMovieDto;
import com.doffeii.userService.entity.dto.UserProfileResponseDto;
import com.doffeii.userService.entity.dto.UserRegisterRequestDto;
import com.doffeii.userService.entity.dto.VerifyRegistrationOtpRequestDto;
import com.doffeii.userService.entity.dto.WalletTopUpRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDao userDao;
    private final ClaimService claimService;
    private final PasswordEncoder passwordEncoder;
    private final OtpEmailSender otpEmailSender;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.otp.expiry-minutes:15}")
    private long otpExpiryMinutes;

    @Value("${app.otp.expose-in-response:false}")
    private boolean exposeOtpInResponse;

    @Override
    public Boolean isUserExist(String userId) {

        User user = userDao.findUserByUserId(userId);

        if (user == null) {
            return false;
        }

        return true;
    }

    @Override
    public UserProfileResponseDto addUser(UserRegisterRequestDto userRegisterRequestDto) {
        String email = userRegisterRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        ensureUserCanRegister(email);
        return createCustomer(email, userRegisterRequestDto.getCustomerName(), passwordEncoder.encode(userRegisterRequestDto.getPassword()));
    }

    @Override
    public OtpRequestResponseDto requestRegistrationOtp(UserRegisterRequestDto userRegisterRequestDto) {
        String email = userRegisterRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userDao.findUserByEmail(email);
        if (user != null && user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        long effectiveOtpExpiryMinutes = Math.max(10, Math.min(15, otpExpiryMinutes));
        String otp = generateOtp();
        Instant expiresAt = Instant.now().plus(effectiveOtpExpiryMinutes, ChronoUnit.MINUTES);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(userRegisterRequestDto.getCustomerName().trim())
                    .password(passwordEncoder.encode(userRegisterRequestDto.getPassword()))
                    .emailVerified(false)
                    .claim(claimService.getOrCreateClaim("CUSTOMER"))
                    .savedPaymentCards(List.of())
                    .bookedMovies(List.of())
                    .favoriteMovies(List.of())
                    .favoriteTheaters(List.of())
                    .walletBalance(BigDecimal.ZERO)
                    .walletTransactions(List.of())
                    .notificationPreferences(defaultNotificationPreferences())
                    .build();
        } else {
            user.setFullName(userRegisterRequestDto.getCustomerName().trim());
            user.setPassword(passwordEncoder.encode(userRegisterRequestDto.getPassword()));
            user.setClaim(claimService.getOrCreateClaim("CUSTOMER"));
        }

        user.setRegistrationOtpHash(passwordEncoder.encode(otp));
        user.setRegistrationOtpCreatedAt(Instant.now());
        user.setRegistrationOtpExpiresAt(expiresAt);
        user.setRegistrationOtpAttempts(0);
        userDao.save(user);

        CompletableFuture.runAsync(() -> otpEmailSender.sendOtp(email, "registration", otp, effectiveOtpExpiryMinutes))
                .exceptionally(exception -> {
                    return null;
                });

        return OtpRequestResponseDto.builder()
                .email(email)
                .expiresAt(expiresAt)
                .message("OTP generated. Email delivery is in progress.")
                .developmentOtp(exposeOtpInResponse ? otp : null)
                .build();
    }

    @Override
    public UserProfileResponseDto verifyRegistrationOtp(VerifyRegistrationOtpRequestDto verifyRegistrationOtpRequestDto) {
        String email = verifyRegistrationOtpRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        User pendingRegistration = userDao.findUserByEmail(email);

        if (pendingRegistration == null) {
            throw new IllegalArgumentException("No registration OTP request found for this email");
        }

        validateOtp(pendingRegistration, verifyRegistrationOtpRequestDto.getOtp());
        pendingRegistration.setEmailVerified(true);
        pendingRegistration.setRegistrationOtpHash(null);
        pendingRegistration.setRegistrationOtpCreatedAt(null);
        pendingRegistration.setRegistrationOtpExpiresAt(null);
        pendingRegistration.setRegistrationOtpAttempts(0);
        return toProfile(userDao.save(pendingRegistration));
    }

    @Override
    public OtpRequestResponseDto requestPasswordResetOtp(PasswordResetRequestDto passwordResetRequestDto) {
        String email = passwordResetRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        long effectiveOtpExpiryMinutes = Math.max(10, Math.min(15, otpExpiryMinutes));
        Instant expiresAt = Instant.now().plus(effectiveOtpExpiryMinutes, ChronoUnit.MINUTES);
        User user = userDao.findUserByEmail(email);

        if (user == null || !user.isEmailVerified()) {
            return OtpRequestResponseDto.builder()
                    .email(email)
                    .expiresAt(expiresAt)
                    .message("If this email exists, a password reset OTP will be sent.")
                    .build();
        }

        String otp = generateOtp();
        user.setRegistrationOtpHash(passwordEncoder.encode(otp));
        user.setRegistrationOtpCreatedAt(Instant.now());
        user.setRegistrationOtpExpiresAt(expiresAt);
        user.setRegistrationOtpAttempts(0);
        userDao.save(user);

        CompletableFuture.runAsync(() -> otpEmailSender.sendOtp(email, "password reset", otp, effectiveOtpExpiryMinutes))
                .exceptionally(exception -> null);

        return OtpRequestResponseDto.builder()
                .email(email)
                .expiresAt(expiresAt)
                .message("If this email exists, a password reset OTP will be sent.")
                .developmentOtp(exposeOtpInResponse ? otp : null)
                .build();
    }

    @Override
    public OtpRequestResponseDto resetPassword(PasswordResetConfirmRequestDto passwordResetConfirmRequestDto) {
        String email = passwordResetConfirmRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userDao.findUserByEmail(email);
        if (user == null || !user.isEmailVerified()) {
            throw new IllegalArgumentException("No password reset request found for this email");
        }

        validatePasswordResetOtp(user, passwordResetConfirmRequestDto.getOtp());
        user.setPassword(passwordEncoder.encode(passwordResetConfirmRequestDto.getNewPassword()));
        clearOtp(user);
        userDao.save(user);

        return OtpRequestResponseDto.builder()
                .email(email)
                .message("Password reset successfully. Please sign in with your new password.")
                .build();
    }

    private void ensureUserCanRegister(String email) {
        if (userDao.findUserByEmail(email) != null) {
            throw new IllegalArgumentException("Email is already registered");
        }
    }

    private UserProfileResponseDto createCustomer(String email, String customerName, String encodedPassword) {
        Claim claim = claimService.getOrCreateClaim("CUSTOMER");

        User user = User.builder()
                        .email(email)
                        .password(encodedPassword)
                        .fullName(customerName.trim())
                        .emailVerified(true)
                        .claim(claim)
                        .savedPaymentCards(List.of())
                        .bookedMovies(List.of())
                        .favoriteMovies(List.of())
                        .favoriteTheaters(List.of())
                        .walletBalance(BigDecimal.ZERO)
                        .walletTransactions(List.of())
                        .notificationPreferences(defaultNotificationPreferences())
                        .build();
        return toProfile(userDao.insert(user));
    }

    @Override
    public UserProfileResponseDto promoteUserToAdmin(String email) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can promote users");
        }

        User user = getUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        Claim claim = claimService.getOrCreateClaim("ADMIN");
        user.setClaim(claim);
        return toProfile(userDao.save(user));
    }

    @Override
    public List<UserProfileResponseDto> getAllUsers() {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can view users");
        }

        return userDao.findAll().stream()
                .map(this::toProfile)
                .toList();
    }

    @Override
    public User getUserByEmail(String email) {
        return userDao.findUserByEmail(email.trim().toLowerCase(Locale.ROOT));
    }

    @Override
    public UserProfileResponseDto getCurrentUserProfile() {
        User user = getAuthenticatedUser();
        return toProfile(user);
    }

    @Override
    public UserProfileResponseDto updateCurrentUserProfile(UpdateUserProfileRequestDto updateUserProfileRequestDto) {
        User user = getAuthenticatedUser();
        user.setFullName(updateUserProfileRequestDto.getFullName().trim());
        user.setPhone(normalizeBlank(updateUserProfileRequestDto.getPhone()));
        user.setPreferredCity(normalizeBlank(updateUserProfileRequestDto.getPreferredCity()));
        user.setSavedPaymentCards(resolveSavedCards(updateUserProfileRequestDto.getSavedPaymentCards(), user.getFullName()));
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto recordBookedMovie(UserBookedMovieDto userBookedMovieDto) {
        User user = getAuthenticatedUser();
        List<UserBookedMovie> bookedMovies = new ArrayList<>(
                user.getBookedMovies() == null ? List.of() : user.getBookedMovies()
        );
        bookedMovies.add(UserBookedMovie.builder()
                .bookingCode(userBookedMovieDto.getBookingCode())
                .movie(userBookedMovieDto.getMovie())
                .saloonName(userBookedMovieDto.getSaloonName())
                .theatreName(userBookedMovieDto.getTheatreName() == null || userBookedMovieDto.getTheatreName().isBlank()
                        ? userBookedMovieDto.getSaloonName()
                        : userBookedMovieDto.getTheatreName())
                .movieDay(userBookedMovieDto.getMovieDay())
                .movieStartTime(userBookedMovieDto.getMovieStartTime())
                .showtimeStartTime(userBookedMovieDto.getShowtimeStartTime() == null || userBookedMovieDto.getShowtimeStartTime().isBlank()
                        ? userBookedMovieDto.getMovieStartTime()
                        : userBookedMovieDto.getShowtimeStartTime())
                .seats(userBookedMovieDto.getSeats())
                .adultTicketCount(userBookedMovieDto.getAdultTicketCount())
                .studentTicketCount(userBookedMovieDto.getStudentTicketCount())
                .totalAmount(userBookedMovieDto.getTotalAmount())
                .bookedAt(userBookedMovieDto.getBookedAt() == null ? Instant.now() : userBookedMovieDto.getBookedAt())
                .status(userBookedMovieDto.getStatus() == null || userBookedMovieDto.getStatus().isBlank()
                        ? "CONFIRMED"
                        : userBookedMovieDto.getStatus())
                .cancelledAt(userBookedMovieDto.getCancelledAt())
                .qrCodePayload(userBookedMovieDto.getQrCodePayload() == null || userBookedMovieDto.getQrCodePayload().isBlank()
                        ? buildQrCodePayload(userBookedMovieDto)
                        : userBookedMovieDto.getQrCodePayload())
                .build());
        user.setBookedMovies(bookedMovies);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto cancelBookedMovie(String bookingCode) {
        User user = getAuthenticatedUser();
        List<UserBookedMovie> bookedMovies = new ArrayList<>(
                user.getBookedMovies() == null ? List.of() : user.getBookedMovies()
        );
        boolean found = false;
        for (UserBookedMovie bookedMovie : bookedMovies) {
            if (bookedMovie.getBookingCode() != null && bookedMovie.getBookingCode().equalsIgnoreCase(bookingCode)) {
                bookedMovie.setStatus("CANCELLED");
                bookedMovie.setCancelledAt(Instant.now());
                found = true;
                break;
            }
        }

        if (!found) {
            throw new IllegalArgumentException("Booking was not found in current user's history");
        }

        user.setBookedMovies(bookedMovies);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto addFavoriteMovie(FavoriteMovieRequestDto favoriteMovieRequestDto) {
        User user = getAuthenticatedUser();
        List<FavoriteMovie> favoriteMovies = new ArrayList<>(
                user.getFavoriteMovies() == null ? List.of() : user.getFavoriteMovies()
        );
        favoriteMovies.removeIf(movie -> movie.getMovieId() == favoriteMovieRequestDto.getMovieId());
        favoriteMovies.add(FavoriteMovie.builder()
                .movieId(favoriteMovieRequestDto.getMovieId())
                .movieName(favoriteMovieRequestDto.getMovieName().trim())
                .movieImageUrl(normalizeBlank(favoriteMovieRequestDto.getMovieImageUrl()))
                .addedAt(Instant.now())
                .build());
        user.setFavoriteMovies(favoriteMovies);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto removeFavoriteMovie(int movieId) {
        User user = getAuthenticatedUser();
        List<FavoriteMovie> favoriteMovies = new ArrayList<>(
                user.getFavoriteMovies() == null ? List.of() : user.getFavoriteMovies()
        );
        favoriteMovies.removeIf(movie -> movie.getMovieId() == movieId);
        user.setFavoriteMovies(favoriteMovies);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto addFavoriteTheater(FavoriteTheaterRequestDto favoriteTheaterRequestDto) {
        User user = getAuthenticatedUser();
        List<FavoriteTheater> favoriteTheaters = new ArrayList<>(
                user.getFavoriteTheaters() == null ? List.of() : user.getFavoriteTheaters()
        );
        String theaterName = favoriteTheaterRequestDto.getTheaterName().trim();
        favoriteTheaters.removeIf(theater -> theater.getTheaterName() != null
                && theater.getTheaterName().equalsIgnoreCase(theaterName));
        favoriteTheaters.add(FavoriteTheater.builder()
                .theaterName(theaterName)
                .cityName(normalizeBlank(favoriteTheaterRequestDto.getCityName()))
                .addedAt(Instant.now())
                .build());
        user.setFavoriteTheaters(favoriteTheaters);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto removeFavoriteTheater(String theaterName) {
        User user = getAuthenticatedUser();
        List<FavoriteTheater> favoriteTheaters = new ArrayList<>(
                user.getFavoriteTheaters() == null ? List.of() : user.getFavoriteTheaters()
        );
        favoriteTheaters.removeIf(theater -> theater.getTheaterName() != null
                && theater.getTheaterName().equalsIgnoreCase(theaterName));
        user.setFavoriteTheaters(favoriteTheaters);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto topUpWallet(WalletTopUpRequestDto walletTopUpRequestDto) {
        User user = getAuthenticatedUser();
        BigDecimal currentBalance = user.getWalletBalance() == null ? BigDecimal.ZERO : user.getWalletBalance();
        BigDecimal amount = walletTopUpRequestDto.getAmount();
        user.setWalletBalance(currentBalance.add(amount));

        List<WalletTransaction> transactions = new ArrayList<>(
                user.getWalletTransactions() == null ? List.of() : user.getWalletTransactions()
        );
        transactions.add(WalletTransaction.builder()
                .transactionId(UUID.randomUUID().toString())
                .amount(amount)
                .type("CREDIT")
                .description(walletTopUpRequestDto.getDescription() == null || walletTopUpRequestDto.getDescription().isBlank()
                        ? "Wallet top-up"
                        : walletTopUpRequestDto.getDescription().trim())
                .createdAt(Instant.now())
                .build());
        user.setWalletTransactions(transactions);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto updateNotificationPreferences(NotificationPreferencesDto notificationPreferencesDto) {
        User user = getAuthenticatedUser();
        user.setNotificationPreferences(NotificationPreferences.builder()
                .emailEnabled(notificationPreferencesDto.isEmailEnabled())
                .smsEnabled(notificationPreferencesDto.isSmsEnabled())
                .whatsappEnabled(notificationPreferencesDto.isWhatsappEnabled())
                .build());
        return toProfile(userDao.save(user));
    }

    @Override
    public boolean isUserCustomer() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> hasRole(a.getAuthority(), "CUSTOMER"));
    }

    @Override
    public boolean isUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> hasRole(a.getAuthority(), "ADMIN"));
    }

    private boolean hasRole(String authority, String role) {
        return authority.equals(role) || authority.equals("ROLE_" + role);
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Sign in is required");
        }

        User user = userDao.findUserByEmail(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("Current user profile was not found");
        }
        return user;
    }

    private UserProfileResponseDto toProfile(User user) {
        if (user == null) {
            return null;
        }

        return UserProfileResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .preferredCity(user.getPreferredCity())
                .role(user.getClaim() != null ? user.getClaim().getClaimName() : null)
                .emailVerified(user.isEmailVerified())
                .verified(user.isEmailVerified())
                .savedPaymentCards(toSavedCardDtos(user.getSavedPaymentCards()))
                .bookedMovies(user.getBookedMovies() == null ? List.of() : user.getBookedMovies())
                .favoriteMovies(user.getFavoriteMovies() == null ? List.of() : user.getFavoriteMovies())
                .favoriteTheaters(user.getFavoriteTheaters() == null ? List.of() : user.getFavoriteTheaters())
                .walletBalance(user.getWalletBalance() == null ? BigDecimal.ZERO : user.getWalletBalance())
                .walletTransactions(user.getWalletTransactions() == null ? List.of() : user.getWalletTransactions())
                .notificationPreferences(toNotificationPreferencesDto(user.getNotificationPreferences()))
                .build();
    }

    private NotificationPreferences defaultNotificationPreferences() {
        return NotificationPreferences.builder()
                .emailEnabled(true)
                .smsEnabled(false)
                .whatsappEnabled(false)
                .build();
    }

    private NotificationPreferencesDto toNotificationPreferencesDto(NotificationPreferences notificationPreferences) {
        NotificationPreferences preferences = notificationPreferences == null
                ? defaultNotificationPreferences()
                : notificationPreferences;
        return NotificationPreferencesDto.builder()
                .emailEnabled(preferences.isEmailEnabled())
                .smsEnabled(preferences.isSmsEnabled())
                .whatsappEnabled(preferences.isWhatsappEnabled())
                .build();
    }

    private String buildQrCodePayload(UserBookedMovieDto bookedMovieDto) {
        return "CINESAGA|booking=" + safe(bookedMovieDto.getBookingCode())
                + "|movie=" + (bookedMovieDto.getMovie() == null ? "" : safe(bookedMovieDto.getMovie().getMovieName()))
                + "|show=" + safe(bookedMovieDto.getMovieDay()) + " " + safe(bookedMovieDto.getMovieStartTime())
                + "|seats=" + String.join(",", bookedMovieDto.getSeats() == null ? List.of() : bookedMovieDto.getSeats());
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("|", " ").trim();
    }

    private List<SavedPaymentCardDto> toSavedCardDtos(List<SavedPaymentCard> cards) {
        if (cards == null) {
            return List.of();
        }

        return cards.stream()
                .map(card -> SavedPaymentCardDto.builder()
                        .cardId(card.getCardId())
                        .nickname(card.getNickname())
                        .cardHolderName(card.getCardHolderName())
                        .cardNumber(card.getCardNumber())
                        .maskedCardNumber(card.getMaskedCardNumber())
                        .cardExpiry(card.getCardExpiry())
                        .cardBrand(card.getCardBrand())
                        .build())
                .toList();
    }

    private List<SavedPaymentCard> resolveSavedCards(List<SavedPaymentCardDto> cards, String fallbackCardHolderName) {
        if (cards == null || cards.isEmpty()) {
            return List.of();
        }
        if (cards.size() > 5) {
            throw new IllegalArgumentException("You can save up to 5 cards");
        }

        List<SavedPaymentCard> savedCards = new ArrayList<>();
        for (SavedPaymentCardDto card : cards) {
            String normalizedCardNumber = normalizeCardNumber(card.getCardNumber());
            if (normalizedCardNumber.length() < 12) {
                throw new IllegalArgumentException("Saved card number must contain at least 12 digits");
            }

            savedCards.add(SavedPaymentCard.builder()
                    .cardId(card.getCardId() == null || card.getCardId().isBlank()
                            ? UUID.randomUUID().toString()
                            : card.getCardId())
                    .nickname(resolveCardNickname(card, normalizedCardNumber))
                    .cardHolderName(card.getCardHolderName() == null || card.getCardHolderName().isBlank()
                            ? fallbackCardHolderName
                            : card.getCardHolderName().trim())
                    .cardNumber(normalizedCardNumber)
                    .maskedCardNumber(maskCardNumber(normalizedCardNumber))
                    .cardExpiry(normalizeBlank(card.getCardExpiry()))
                    .cardBrand(resolveCardBrand(normalizedCardNumber))
                    .createdAt(Instant.now())
                    .build());
        }
        return savedCards;
    }

    private String resolveCardNickname(SavedPaymentCardDto card, String cardNumber) {
        if (card.getNickname() != null && !card.getNickname().isBlank()) {
            return card.getNickname().trim();
        }
        return resolveCardBrand(cardNumber) + " " + cardNumber.substring(cardNumber.length() - 4);
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeCardNumber(String cardNumber) {
        return cardNumber == null ? "" : cardNumber.replaceAll("[^0-9]", "");
    }

    private String maskCardNumber(String cardNumber) {
        String lastFour = cardNumber.substring(cardNumber.length() - 4);
        return "**** **** **** " + lastFour;
    }

    private String resolveCardBrand(String cardNumber) {
        if (cardNumber.startsWith("4")) {
            return "Visa";
        }
        if (cardNumber.matches("5[1-5].*")) {
            return "Mastercard";
        }
        if (cardNumber.matches("3[47].*")) {
            return "American Express";
        }
        if (cardNumber.matches("6(?:011|5).*")) {
            return "Discover";
        }
        return "Card";
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private void validateOtp(User otpVerification, String otp) {
        if (otpVerification.isEmailVerified()) {
            return;
        }
        if (otpVerification.getRegistrationOtpHash() == null || otpVerification.getRegistrationOtpExpiresAt() == null) {
            throw new IllegalArgumentException("No registration OTP request found for this email");
        }
        if (otpVerification.getRegistrationOtpExpiresAt().isBefore(Instant.now())) {
            clearOtp(otpVerification);
            userDao.save(otpVerification);
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (otpVerification.getRegistrationOtpAttempts() >= 5) {
            clearOtp(otpVerification);
            userDao.save(otpVerification);
            throw new IllegalArgumentException("Too many invalid OTP attempts. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otp, otpVerification.getRegistrationOtpHash())) {
            otpVerification.setRegistrationOtpAttempts(otpVerification.getRegistrationOtpAttempts() + 1);
            userDao.save(otpVerification);
            throw new IllegalArgumentException("Invalid OTP");
        }
    }

    private void validatePasswordResetOtp(User user, String otp) {
        if (user.getRegistrationOtpHash() == null || user.getRegistrationOtpExpiresAt() == null) {
            throw new IllegalArgumentException("No password reset request found for this email");
        }
        if (user.getRegistrationOtpExpiresAt().isBefore(Instant.now())) {
            clearOtp(user);
            userDao.save(user);
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }
        if (user.getRegistrationOtpAttempts() >= 5) {
            clearOtp(user);
            userDao.save(user);
            throw new IllegalArgumentException("Too many invalid OTP attempts. Please request a new OTP.");
        }
        if (!passwordEncoder.matches(otp, user.getRegistrationOtpHash())) {
            user.setRegistrationOtpAttempts(user.getRegistrationOtpAttempts() + 1);
            userDao.save(user);
            throw new IllegalArgumentException("Invalid OTP");
        }
    }

    private void clearOtp(User user) {
        user.setRegistrationOtpHash(null);
        user.setRegistrationOtpCreatedAt(null);
        user.setRegistrationOtpExpiresAt(null);
        user.setRegistrationOtpAttempts(0);
    }
}
