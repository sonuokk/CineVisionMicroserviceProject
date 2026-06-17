package com.doffeii.userService.business.concretes;

import com.doffeii.userService.business.abstracts.RoleService;
import com.doffeii.userService.business.abstracts.UserService;
import com.doffeii.userService.dao.UserDao;
import com.doffeii.userService.entity.Role;
import com.doffeii.userService.entity.FavoriteMovie;
import com.doffeii.userService.entity.FavoriteTheater;
import com.doffeii.userService.entity.NotificationPreferences;
import com.doffeii.userService.entity.SavedPaymentCard;
import com.doffeii.userService.entity.User;
import com.doffeii.userService.entity.UserBookedMovie;
import com.doffeii.userService.entity.WalletTransaction;
import com.doffeii.userService.entity.dto.AdminNotificationRequestDto;
import com.doffeii.userService.entity.dto.AdminNotificationResponseDto;
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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.security.SecureRandom;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.concurrent.CompletableFuture;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDao userDao;
    private final RoleService RoleService;
    private final PasswordEncoder passwordEncoder;
    private final OtpEmailSender otpEmailSender;
    private final RestTemplate restTemplate;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_CUSTOMER = "CUSTOMER";
    private static final String ROLE_THEATER_MANAGER = "THEATER_MANAGER";
    private static final String REQUEST_NONE = "NONE";
    private static final String REQUEST_PENDING = "PENDING";
    private static final String REQUEST_APPROVED = "APPROVED";
    private static final String REQUEST_REJECTED = "REJECTED";

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
        String roleName = resolveRegistrationRole(userRegisterRequestDto.getRole());
        String accountRole = resolveAccountRoleForRegistration(roleName);
        return createUser(email, userRegisterRequestDto.getCustomerName(),
                passwordEncoder.encode(userRegisterRequestDto.getPassword()),
                accountRole,
                resolveManagedTheaters(userRegisterRequestDto, roleName),
                roleName);
    }

    @Override
    public OtpRequestResponseDto requestRegistrationOtp(UserRegisterRequestDto userRegisterRequestDto) {
        String email = userRegisterRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);

        User user = userDao.findUserByEmail(email);
        if (user != null && user.isEmailVerified()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        long effectiveOtpExpiryMinutes = Math.max(10, Math.min(15, otpExpiryMinutes));
        String roleName = resolveRegistrationRole(userRegisterRequestDto.getRole());
        String accountRole = resolveAccountRoleForRegistration(roleName);
        List<String> managedTheaters = resolveManagedTheaters(userRegisterRequestDto, roleName);
        String otp = generateOtp();
        Instant expiresAt = Instant.now().plus(effectiveOtpExpiryMinutes, ChronoUnit.MINUTES);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(userRegisterRequestDto.getCustomerName().trim())
                    .password(passwordEncoder.encode(userRegisterRequestDto.getPassword()))
                    .emailVerified(false)
                    .role(RoleService.getOrCreateRole(accountRole))
                    .managedTheaterNames(managedTheaters)
                    .theaterManagerRequestStatus(initialTheaterManagerStatus(roleName))
                    .theaterManagerRequestedAt(resolveTheaterManagerRequestedAt(roleName))
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
            user.setRole(RoleService.getOrCreateRole(accountRole));
            user.setManagedTheaterNames(managedTheaters);
            user.setTheaterManagerRequestStatus(initialTheaterManagerStatus(roleName));
            user.setTheaterManagerRequestedAt(resolveTheaterManagerRequestedAt(roleName));
            user.setTheaterManagerReviewedAt(null);
            user.setTheaterManagerRejectedAt(null);
            user.setTheaterManagerDeleteAfter(null);
            user.setTheaterManagerRejectionReason(null);
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
        User savedUser = userDao.save(pendingRegistration);
        notifyAdminsOfTheaterManagerRequest(savedUser);
        return toProfile(savedUser);
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

    private UserProfileResponseDto createUser(String email, String customerName, String encodedPassword, String roleName,
                                              List<String> managedTheaterNames, String requestedRoleName) {
        Role Role = RoleService.getOrCreateRole(roleName);

        User user = User.builder()
                        .email(email)
                        .password(encodedPassword)
                        .fullName(customerName.trim())
                        .emailVerified(true)
                        .role(Role)
                        .managedTheaterNames(managedTheaterNames)
                        .theaterManagerRequestStatus(initialTheaterManagerStatus(requestedRoleName))
                        .theaterManagerRequestedAt(resolveTheaterManagerRequestedAt(requestedRoleName))
                        .savedPaymentCards(List.of())
                        .bookedMovies(List.of())
                        .favoriteMovies(List.of())
                        .favoriteTheaters(List.of())
                        .walletBalance(BigDecimal.ZERO)
                        .walletTransactions(List.of())
                        .notificationPreferences(defaultNotificationPreferences())
                        .build();
        User savedUser = userDao.insert(user);
        notifyAdminsOfTheaterManagerRequest(savedUser);
        return toProfile(savedUser);
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

        Role Role = RoleService.getOrCreateRole(ROLE_ADMIN);
        user.setRole(Role);
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto promoteUserToTheaterManager(String email, String theaterName) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can promote theater managers");
        }

        User user = getUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        Role Role = RoleService.getOrCreateRole(ROLE_THEATER_MANAGER);
        user.setRole(Role);
        List<String> managedTheaters = new ArrayList<>(user.getManagedTheaterNames() == null
                ? List.of()
                : user.getManagedTheaterNames());
        managedTheaters.addAll(resolveManagedTheaters(theaterName));
        user.setManagedTheaterNames(new ArrayList<>(new LinkedHashSet<>(managedTheaters)));
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto updateUserRole(String email, String role, String theaterName) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can update user roles");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User user = getUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        String roleName = resolveRegistrationRole(role);
        user.setRole(RoleService.getOrCreateRole(roleName));
        if (ROLE_THEATER_MANAGER.equals(roleName)) {
            user.setManagedTheaterNames(resolveManagedTheaters(theaterName));
            markTheaterManagerApproved(user);
        } else {
            user.setManagedTheaterNames(List.of());
            clearTheaterManagerRequest(user);
        }
        return toProfile(userDao.save(user));
    }

    @Override
    public UserProfileResponseDto approveTheaterManagerRequest(String email, String theaterName) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can approve theater manager requests");
        }
        User user = getUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }
        List<String> managedTheaters = resolveManagedTheaters(theaterName);
        user.setRole(RoleService.getOrCreateRole(ROLE_THEATER_MANAGER));
        user.setManagedTheaterNames(managedTheaters);
        markTheaterManagerApproved(user);
        User savedUser = userDao.save(user);
        CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                savedUser.getEmail(),
                "Your CineSaga theatre manager request was approved",
                "An admin approved your theatre manager request. You can now manage: " + String.join(", ", managedTheaters) + "."
        )).exceptionally(exception -> null);
        return toProfile(savedUser);
    }

    @Override
    public UserProfileResponseDto rejectTheaterManagerRequest(String email, String reason) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can reject theater manager requests");
        }
        User user = getUserByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("No user found with this email");
        }
        String reasonText = reason == null || reason.isBlank()
                ? "Admin rejected the theatre manager request"
                : reason.trim();
        Instant deleteAfter = Instant.now().plus(24, ChronoUnit.HOURS);
        user.setRole(RoleService.getOrCreateRole(ROLE_CUSTOMER));
        user.setManagedTheaterNames(List.of());
        user.setTheaterManagerRequestStatus(REQUEST_REJECTED);
        user.setTheaterManagerReviewedAt(Instant.now());
        user.setTheaterManagerRejectedAt(Instant.now());
        user.setTheaterManagerDeleteAfter(deleteAfter);
        user.setTheaterManagerRejectionReason(reasonText);
        User savedUser = userDao.save(user);
        CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                savedUser.getEmail(),
                "Your CineSaga theatre manager request was rejected",
                "An admin rejected your theatre manager request. Reason: " + reasonText
                        + ". Your account will be deleted after 24 hours unless an admin changes this decision."
        )).exceptionally(exception -> null);
        return toProfile(savedUser);
    }

    @Override
    public UserProfileResponseDto blacklistUser(String email, String duration, String reason) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can blacklist users");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User targetUser = getUserByEmail(email);
        if (targetUser == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        User currentAdmin = getAuthenticatedUser();
        if (currentAdmin.getEmail() != null && currentAdmin.getEmail().equalsIgnoreCase(targetUser.getEmail())) {
            throw new IllegalArgumentException("You cannot blacklist your own admin account");
        }

        Instant blacklistedUntil = resolveBlacklistUntil(duration);
        String reasonText = reason == null || reason.isBlank()
                ? "Admin action"
                : reason.trim();
        targetUser.setBlacklistedAt(Instant.now());
        targetUser.setBlacklistedUntil(blacklistedUntil);
        targetUser.setBlacklistReason(reasonText);
        User savedUser = userDao.save(targetUser);
        String periodText = formatBlacklistPeriod(blacklistedUntil);
        CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                savedUser.getEmail(),
                "Your CineSaga account was blacklisted",
                "An admin blacklisted your CineSaga account for " + periodText + ". Reason: " + reasonText + "."
        )).exceptionally(exception -> null);
        return toProfile(savedUser);
    }

    @Override
    public UserProfileResponseDto removeUserBlacklist(String email) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can remove blacklists");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        User targetUser = getUserByEmail(email);
        if (targetUser == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        targetUser.setBlacklistedAt(null);
        targetUser.setBlacklistedUntil(null);
        targetUser.setBlacklistReason(null);
        User savedUser = userDao.save(targetUser);
        CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                savedUser.getEmail(),
                "Your CineSaga account blacklist was removed",
                "An admin removed the blacklist from your CineSaga account. You can sign in again."
        )).exceptionally(exception -> null);
        return toProfile(savedUser);
    }

    @Override
    public AdminNotificationResponseDto sendAdminNotification(AdminNotificationRequestDto adminNotificationRequestDto) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can send notifications");
        }

        String subject = adminNotificationRequestDto.getSubject() == null
                ? ""
                : adminNotificationRequestDto.getSubject().trim();
        String message = adminNotificationRequestDto.getMessage() == null
                ? ""
                : adminNotificationRequestDto.getMessage().trim();
        if (subject.isBlank() || message.isBlank()) {
            throw new IllegalArgumentException("Subject and message are required");
        }

        List<User> recipients = resolveNotificationRecipients(adminNotificationRequestDto);
        if (recipients.isEmpty()) {
            throw new IllegalArgumentException("No matching users were found for this notification");
        }

        recipients.forEach(user -> CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                user.getEmail(),
                subject,
                message
        )).exceptionally(exception -> null));

        return AdminNotificationResponseDto.builder()
                .recipientCount(recipients.size())
                .message("Notification queued for " + recipients.size() + " recipient(s).")
                .build();
    }

    @Override
    public void deleteUserByEmail(String email, String authorizationHeader) {
        if (!isUserAdmin()) {
            throw new IllegalArgumentException("Only an admin can delete users");
        }

        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        User targetUser = getUserByEmail(normalizedEmail);
        if (targetUser == null) {
            throw new IllegalArgumentException("No user found with this email");
        }

        User currentAdmin = getAuthenticatedUser();
        if (currentAdmin.getEmail() != null && currentAdmin.getEmail().equalsIgnoreCase(targetUser.getEmail())) {
            throw new IllegalArgumentException("Use profile account deletion to delete your own account");
        }

        purgeMovieServiceRecords(targetUser, authorizationHeader);
        CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                targetUser.getEmail(),
                "Your CineSaga account was deleted",
                "An admin deleted your CineSaga account and related ticket records."
        )).exceptionally(exception -> null);
        userDao.delete(targetUser);
    }

    @Override
    public OtpRequestResponseDto requestAccountDeletionOtp() {
        User user = getAuthenticatedUser();
        long effectiveOtpExpiryMinutes = Math.max(10, Math.min(15, otpExpiryMinutes));
        Instant expiresAt = Instant.now().plus(effectiveOtpExpiryMinutes, ChronoUnit.MINUTES);
        String otp = generateOtp();

        user.setRegistrationOtpHash(passwordEncoder.encode(otp));
        user.setRegistrationOtpCreatedAt(Instant.now());
        user.setRegistrationOtpExpiresAt(expiresAt);
        user.setRegistrationOtpAttempts(0);
        userDao.save(user);

        CompletableFuture.runAsync(() -> otpEmailSender.sendOtp(user.getEmail(), "account deletion", otp, effectiveOtpExpiryMinutes))
                .exceptionally(exception -> null);

        return OtpRequestResponseDto.builder()
                .email(user.getEmail())
                .expiresAt(expiresAt)
                .message("Account deletion OTP generated. Email delivery is in progress.")
                .developmentOtp(exposeOtpInResponse ? otp : null)
                .build();
    }

    @Override
    public void confirmAccountDeletion(String otp, String authorizationHeader) {
        User user = getAuthenticatedUser();
        validateSensitiveOtp(user, otp);
        purgeMovieServiceRecords(user, authorizationHeader);
        userDao.delete(user);
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
    public List<UserProfileResponseDto> getVisibleBookedTicketUsers() {
        if (!canManageTheaters()) {
            throw new IllegalArgumentException("Only an admin or theater manager can view booked tickets");
        }

        List<String> managerTheaters = isUserAdmin()
                ? List.of()
                : getAuthenticatedUser().getManagedTheaterNames() == null
                    ? List.of()
                    : getAuthenticatedUser().getManagedTheaterNames();

        return userDao.findAll().stream()
                .map(this::toProfile)
                .peek(profile -> {
                    List<UserBookedMovie> bookedMovies = profile.getBookedMovies() == null
                            ? List.of()
                            : profile.getBookedMovies();
                    if (!isUserAdmin()) {
                        bookedMovies = bookedMovies.stream()
                                .filter(bookedMovie -> managerTheaters.stream()
                                        .map(this::normalizeTheaterName)
                                        .anyMatch(theaterName -> theaterName.equalsIgnoreCase(
                                                normalizeTheaterName(resolveBookedMovieTheater(bookedMovie)))))
                                .toList();
                    }
                    profile.setBookedMovies(bookedMovies);
                })
                .filter(profile -> profile.getBookedMovies() != null && !profile.getBookedMovies().isEmpty())
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
        user.setProfileImageUrl(normalizeProfileImage(updateUserProfileRequestDto.getProfileImageUrl()));
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
                .anyMatch(a -> hasRole(a.getAuthority(), ROLE_CUSTOMER));
    }

    @Override
    public boolean isUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> hasRole(a.getAuthority(), ROLE_ADMIN));
    }

    @Override
    public boolean isUserTheaterManager() {
        User user = getAuthenticatedUser();
        return effectiveRoleName(user).equals(ROLE_THEATER_MANAGER);
    }

    @Override
    public boolean canManageTheaters() {
        return isUserAdmin() || isUserTheaterManager();
    }

    @Override
    public boolean canManageTheater(String theaterName) {
        if (isUserAdmin()) {
            return true;
        }
        if (!isUserTheaterManager()) {
            return false;
        }

        User user = getAuthenticatedUser();
        String normalizedTheaterName = normalizeTheaterName(theaterName);
        return user.getManagedTheaterNames() != null && user.getManagedTheaterNames().stream()
                .map(this::normalizeTheaterName)
                .anyMatch(assignedTheater -> assignedTheater.equalsIgnoreCase(normalizedTheaterName));
    }

    private boolean hasRole(String authority, String role) {
        return authority.equals(role) || authority.equals("ROLE_" + role);
    }

    private String resolveRegistrationRole(String requestedRole) {
        if (requestedRole == null || requestedRole.isBlank()) {
            return ROLE_CUSTOMER;
        }

        String normalizedRole = requestedRole.trim().toUpperCase(Locale.ROOT).replace("ROLE_", "");
        if ("USER".equals(normalizedRole)) {
            return ROLE_CUSTOMER;
        }
        if ("THEATRE_MANAGER".equals(normalizedRole) || ROLE_THEATER_MANAGER.equals(normalizedRole)) {
            return ROLE_THEATER_MANAGER;
        }
        return ROLE_CUSTOMER;
    }

    private String resolveAccountRoleForRegistration(String requestedRole) {
        return ROLE_THEATER_MANAGER.equals(requestedRole) ? ROLE_CUSTOMER : requestedRole;
    }

    private String initialTheaterManagerStatus(String requestedRole) {
        return ROLE_THEATER_MANAGER.equals(requestedRole) ? REQUEST_PENDING : REQUEST_NONE;
    }

    private Instant resolveTheaterManagerRequestedAt(String requestedRole) {
        return ROLE_THEATER_MANAGER.equals(requestedRole) ? Instant.now() : null;
    }

    private void markTheaterManagerApproved(User user) {
        user.setTheaterManagerRequestStatus(REQUEST_APPROVED);
        user.setTheaterManagerReviewedAt(Instant.now());
        user.setTheaterManagerRejectedAt(null);
        user.setTheaterManagerDeleteAfter(null);
        user.setTheaterManagerRejectionReason(null);
        if (user.getTheaterManagerRequestedAt() == null) {
            user.setTheaterManagerRequestedAt(Instant.now());
        }
    }

    private void clearTheaterManagerRequest(User user) {
        user.setTheaterManagerRequestStatus(REQUEST_NONE);
        user.setTheaterManagerRequestedAt(null);
        user.setTheaterManagerReviewedAt(null);
        user.setTheaterManagerRejectedAt(null);
        user.setTheaterManagerDeleteAfter(null);
        user.setTheaterManagerRejectionReason(null);
    }

    private List<String> resolveManagedTheaters(UserRegisterRequestDto userRegisterRequestDto, String roleName) {
        if (!ROLE_THEATER_MANAGER.equals(roleName)) {
            return List.of();
        }

        return resolveManagedTheaters(userRegisterRequestDto.getTheaterName());
    }

    private List<String> resolveManagedTheaters(String requestedTheaterName) {
        String theaterName = normalizeTheaterName(requestedTheaterName);
        if (theaterName.isBlank()) {
            throw new IllegalArgumentException("Theater name is required for theater manager accounts");
        }
        return Arrays.stream(theaterName.split(","))
                .map(this::normalizeTheaterName)
                .filter(name -> !name.isBlank())
                .distinct()
                .toList();
    }

    private String normalizeTheaterName(String theaterName) {
        return theaterName == null ? "" : theaterName.trim();
    }

    private String resolveBookedMovieTheater(UserBookedMovie bookedMovie) {
        if (bookedMovie == null) {
            return "";
        }
        if (bookedMovie.getTheatreName() != null && !bookedMovie.getTheatreName().isBlank()) {
            return bookedMovie.getTheatreName();
        }
        return bookedMovie.getSaloonName();
    }

    private List<User> resolveNotificationRecipients(AdminNotificationRequestDto requestDto) {
        String audience = requestDto.getAudience() == null
                ? ""
                : requestDto.getAudience().trim().toUpperCase(Locale.ROOT).replace("-", "_");
        if ("SPECIFIC".equals(audience)) {
            if (requestDto.getEmail() == null || requestDto.getEmail().isBlank()) {
                throw new IllegalArgumentException("Email is required for a specific notification");
            }
            User user = getUserByEmail(requestDto.getEmail());
            return user == null || !user.isEmailVerified() ? List.of() : List.of(user);
        }

        return userDao.findAll().stream()
                .filter(User::isEmailVerified)
                .filter(user -> switch (audience) {
                    case "ALL" -> true;
                    case "CUSTOMERS", "CUSTOMER" -> userHasStoredRole(user, ROLE_CUSTOMER);
                    case "THEATER_MANAGERS", "THEATRE_MANAGERS", "THEATER_MANAGER", "THEATRE_MANAGER" ->
                            userHasStoredRole(user, ROLE_THEATER_MANAGER);
                    case "ADMINS", "ADMIN" -> userHasStoredRole(user, ROLE_ADMIN);
                    default -> throw new IllegalArgumentException("Choose a valid notification audience");
                })
                .toList();
    }

    private void notifyAdminsOfTheaterManagerRequest(User user) {
        if (user == null || !REQUEST_PENDING.equals(user.getTheaterManagerRequestStatus()) || !user.isEmailVerified()) {
            return;
        }

        userDao.findAll().stream()
                .filter(admin -> admin.isEmailVerified() && userHasStoredRole(admin, ROLE_ADMIN))
                .forEach(admin -> CompletableFuture.runAsync(() -> otpEmailSender.sendAdminNotice(
                        admin.getEmail(),
                        "New CineSaga theatre manager request",
                        (user.getFullName() == null || user.getFullName().isBlank() ? user.getEmail() : user.getFullName())
                                + " requested theatre manager access. Review the request in Manage Users."
                )).exceptionally(exception -> null));
    }

    private boolean userHasStoredRole(User user, String role) {
        return user.getRole() != null
                && user.getRole().getRoleName() != null
                && hasRole(user.getRole().getRoleName(), role);
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
                .profileImageUrl(user.getProfileImageUrl())
                .role(effectiveRoleName(user))
                .emailVerified(user.isEmailVerified())
                .verified(user.isEmailVerified())
                .blacklisted(isActiveBlacklist(user))
                .blacklistedUntil(user.getBlacklistedUntil())
                .blacklistReason(user.getBlacklistReason())
                .theaterManagerRequestStatus(effectiveTheaterManagerRequestStatus(user))
                .theaterManagerRequestedAt(user.getTheaterManagerRequestedAt())
                .theaterManagerReviewedAt(user.getTheaterManagerReviewedAt())
                .theaterManagerRejectedAt(user.getTheaterManagerRejectedAt())
                .theaterManagerDeleteAfter(user.getTheaterManagerDeleteAfter())
                .theaterManagerRejectionReason(user.getTheaterManagerRejectionReason())
                .savedPaymentCards(toSavedCardDtos(user.getSavedPaymentCards()))
                .bookedMovies(user.getBookedMovies() == null ? List.of() : user.getBookedMovies())
                .favoriteMovies(user.getFavoriteMovies() == null ? List.of() : user.getFavoriteMovies())
                .favoriteTheaters(user.getFavoriteTheaters() == null ? List.of() : user.getFavoriteTheaters())
                .managedTheaterNames(user.getManagedTheaterNames() == null ? List.of() : user.getManagedTheaterNames())
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

    private String effectiveRoleName(User user) {
        String roleName = user == null || user.getRole() == null || user.getRole().getRoleName() == null
                ? ROLE_CUSTOMER
                : user.getRole().getRoleName();
        if (ROLE_THEATER_MANAGER.equals(roleName) && !REQUEST_APPROVED.equals(user.getTheaterManagerRequestStatus())) {
            return ROLE_CUSTOMER;
        }
        return roleName;
    }

    private String effectiveTheaterManagerRequestStatus(User user) {
        if (user == null) {
            return REQUEST_NONE;
        }
        if (user.getTheaterManagerRequestStatus() != null && !user.getTheaterManagerRequestStatus().isBlank()) {
            return user.getTheaterManagerRequestStatus();
        }
        if (user.getRole() != null && ROLE_THEATER_MANAGER.equals(user.getRole().getRoleName())) {
            return REQUEST_PENDING;
        }
        return REQUEST_NONE;
    }

    private String normalizeProfileImage(String profileImageUrl) {
        String normalizedProfileImage = normalizeBlank(profileImageUrl);
        if (normalizedProfileImage == null) {
            return null;
        }
        if (!normalizedProfileImage.startsWith("data:image/")) {
            throw new IllegalArgumentException("Profile picture must be an image selected from your device");
        }
        if (normalizedProfileImage.length() > 1_500_000) {
            throw new IllegalArgumentException("Profile picture is too large. Choose an image under 1 MB.");
        }
        return normalizedProfileImage;
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

    private Instant resolveBlacklistUntil(String duration) {
        String normalizedDuration = duration == null ? "" : duration.trim().toUpperCase(Locale.ROOT).replace("-", "_");
        Instant now = Instant.now();
        return switch (normalizedDuration) {
            case "7_DAYS", "SEVEN_DAYS" -> now.plus(7, ChronoUnit.DAYS);
            case "1_MONTH", "ONE_MONTH" -> now.plus(30, ChronoUnit.DAYS);
            case "3_MONTHS", "THREE_MONTHS" -> now.plus(90, ChronoUnit.DAYS);
            case "6_MONTHS", "SIX_MONTHS", "MANY_MONTHS" -> now.plus(180, ChronoUnit.DAYS);
            case "PERMANENT", "FOREVER" -> null;
            default -> throw new IllegalArgumentException("Choose a valid blacklist duration");
        };
    }

    private String formatBlacklistPeriod(Instant blacklistedUntil) {
        if (blacklistedUntil == null) {
            return "a permanent period";
        }
        return "until " + blacklistedUntil.toString();
    }

    private boolean isActiveBlacklist(User user) {
        if (user == null || user.getBlacklistedAt() == null) {
            return false;
        }
        return user.getBlacklistedUntil() == null || user.getBlacklistedUntil().isAfter(Instant.now());
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
                        .cardSecurityCode(card.getCardSecurityCode())
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
            String normalizedSecurityCode = normalizeSecurityCode(card.getCardSecurityCode());
            if (normalizedSecurityCode.length() < 3) {
                throw new IllegalArgumentException("Saved card CVV must contain 3 or 4 digits");
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
                    .cardSecurityCode(normalizedSecurityCode)
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

    private String normalizeSecurityCode(String cardSecurityCode) {
        String normalizedSecurityCode = cardSecurityCode == null ? "" : cardSecurityCode.replaceAll("[^0-9]", "");
        return normalizedSecurityCode.length() > 4 ? normalizedSecurityCode.substring(0, 4) : normalizedSecurityCode;
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

    private void validateSensitiveOtp(User user, String otp) {
        if (user.getRegistrationOtpHash() == null || user.getRegistrationOtpExpiresAt() == null) {
            throw new IllegalArgumentException("No account deletion OTP request found for this email");
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

    private void purgeMovieServiceRecords(User user, String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Authorization is required to delete account records");
        }

        String purgeUrl = UriComponentsBuilder
                .fromUriString("http://MOVIESERVICE/api/movie/payments/user-records")
                .queryParam("email", user.getEmail())
                .queryParam("userId", user.getUserId())
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.AUTHORIZATION, authorizationHeader);
        restTemplate.exchange(purgeUrl, HttpMethod.DELETE, new HttpEntity<>(headers), Void.class);
    }

    private void clearOtp(User user) {
        user.setRegistrationOtpHash(null);
        user.setRegistrationOtpCreatedAt(null);
        user.setRegistrationOtpExpiresAt(null);
        user.setRegistrationOtpAttempts(0);
    }
}
