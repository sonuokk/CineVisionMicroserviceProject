package com.kaankaplan.userService.business.concretes;

import com.kaankaplan.userService.business.abstracts.ClaimService;
import com.kaankaplan.userService.business.abstracts.UserService;
import com.kaankaplan.userService.dao.UserDao;
import com.kaankaplan.userService.dao.UserOtpVerificationDao;
import com.kaankaplan.userService.entity.Claim;
import com.kaankaplan.userService.entity.User;
import com.kaankaplan.userService.entity.UserOtpVerification;
import com.kaankaplan.userService.entity.dto.AdminRegisterRequestDto;
import com.kaankaplan.userService.entity.dto.OtpRequestResponseDto;
import com.kaankaplan.userService.entity.dto.UserProfileResponseDto;
import com.kaankaplan.userService.entity.dto.UserRegisterRequestDto;
import com.kaankaplan.userService.entity.dto.VerifyRegistrationOtpRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserDao userDao;
    private final UserOtpVerificationDao userOtpVerificationDao;
    private final ClaimService claimService;
    private final PasswordEncoder passwordEncoder;
    private final OtpEmailSender otpEmailSender;

    private static final String REGISTRATION_PURPOSE = "REGISTRATION";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${app.admin.setup-key:CHANGE_ME_ADMIN_SETUP_KEY}")
    private String adminSetupKey;

    @Value("${app.otp.expiry-minutes:10}")
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
        String phone = normalizeIndianPhoneNumber(userRegisterRequestDto.getPhone());

        ensureUserCanRegister(email, phone);
        return createCustomer(email, phone, userRegisterRequestDto.getCustomerName(), passwordEncoder.encode(userRegisterRequestDto.getPassword()));
    }

    @Override
    public OtpRequestResponseDto requestRegistrationOtp(UserRegisterRequestDto userRegisterRequestDto) {
        String email = userRegisterRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        String phone = normalizeIndianPhoneNumber(userRegisterRequestDto.getPhone());

        ensureUserCanRegister(email, phone);

        String otp = generateOtp();
        Instant expiresAt = Instant.now().plus(otpExpiryMinutes, ChronoUnit.MINUTES);
        userOtpVerificationDao.deleteByEmailAndPurpose(email, REGISTRATION_PURPOSE);
        userOtpVerificationDao.save(UserOtpVerification.builder()
                .email(email)
                .purpose(REGISTRATION_PURPOSE)
                .otpHash(passwordEncoder.encode(otp))
                .customerName(userRegisterRequestDto.getCustomerName().trim())
                .phone(phone)
                .passwordHash(passwordEncoder.encode(userRegisterRequestDto.getPassword()))
                .createdAt(Instant.now())
                .expiresAt(expiresAt)
                .attempts(0)
                .build());

        otpEmailSender.sendOtp(email, "registration", otp);

        return OtpRequestResponseDto.builder()
                .email(email)
                .expiresAt(expiresAt)
                .message("OTP sent to your email. Verify it to create your account.")
                .developmentOtp(exposeOtpInResponse ? otp : null)
                .build();
    }

    @Override
    public UserProfileResponseDto verifyRegistrationOtp(VerifyRegistrationOtpRequestDto verifyRegistrationOtpRequestDto) {
        String email = verifyRegistrationOtpRequestDto.getEmail().trim().toLowerCase(Locale.ROOT);
        UserOtpVerification pendingRegistration =
                userOtpVerificationDao.findTopByEmailAndPurposeOrderByCreatedAtDesc(email, REGISTRATION_PURPOSE);

        if (pendingRegistration == null) {
            throw new IllegalArgumentException("No registration OTP request found for this email");
        }

        validateOtp(pendingRegistration, verifyRegistrationOtpRequestDto.getOtp());
        ensureUserCanRegister(pendingRegistration.getEmail(), pendingRegistration.getPhone());

        UserProfileResponseDto profile = createCustomer(
                pendingRegistration.getEmail(),
                pendingRegistration.getPhone(),
                pendingRegistration.getCustomerName(),
                pendingRegistration.getPasswordHash()
        );
        userOtpVerificationDao.deleteByEmailAndPurpose(email, REGISTRATION_PURPOSE);
        return profile;
    }

    private void ensureUserCanRegister(String email, String phone) {
        if (userDao.findUserByEmail(email) != null) {
            throw new IllegalArgumentException("Email is already registered");
        }

        if (phone != null && userDao.findUserByPhone(phone) != null) {
            throw new IllegalArgumentException("Phone number is already registered");
        }
    }

    private UserProfileResponseDto createCustomer(String email, String phone, String customerName, String encodedPassword) {
        Claim claim = claimService.getOrCreateClaim("CUSTOMER");

        User user = User.builder()
                        .email(email)
                        .phone(phone)
                        .password(encodedPassword)
                        .fullName(customerName.trim())
                        .emailVerified(true)
                        .claim(claim)
                        .build();
        return toProfile(userDao.insert(user));
    }

    @Override
    public UserProfileResponseDto addAdmin(AdminRegisterRequestDto adminRegisterRequestDto) {
        if (!adminSetupKey.equals(adminRegisterRequestDto.getSetupKey())) {
            throw new IllegalArgumentException("Invalid admin setup key");
        }

        Claim claim = claimService.getOrCreateClaim("ADMIN");
        User user = User.builder()
                .email(adminRegisterRequestDto.getEmail())
                .password(passwordEncoder.encode(adminRegisterRequestDto.getPassword()))
                .fullName(adminRegisterRequestDto.getFullName())
                .emailVerified(true)
                .claim(claim)
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
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userDao.findUserByEmail(authentication.getName());
        return toProfile(user);
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

    private UserProfileResponseDto toProfile(User user) {
        if (user == null) {
            return null;
        }

        return UserProfileResponseDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getClaim() != null ? user.getClaim().getClaimName() : null)
                .build();
    }

    private String normalizeIndianPhoneNumber(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String digits = phone.replaceAll("[^0-9]", "");

        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        } else if (digits.length() == 11 && digits.startsWith("0")) {
            digits = digits.substring(1);
        }

        if (!digits.matches("[6-9]\\d{9}")) {
            return null;
        }

        return "+91" + digits;
    }

    private String generateOtp() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private void validateOtp(UserOtpVerification otpVerification, String otp) {
        if (otpVerification.getExpiresAt().isBefore(Instant.now())) {
            userOtpVerificationDao.deleteByEmailAndPurpose(otpVerification.getEmail(), otpVerification.getPurpose());
            throw new IllegalArgumentException("OTP has expired. Please request a new OTP.");
        }

        if (otpVerification.getAttempts() >= 5) {
            userOtpVerificationDao.deleteByEmailAndPurpose(otpVerification.getEmail(), otpVerification.getPurpose());
            throw new IllegalArgumentException("Too many invalid OTP attempts. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(otp, otpVerification.getOtpHash())) {
            otpVerification.setAttempts(otpVerification.getAttempts() + 1);
            userOtpVerificationDao.save(otpVerification);
            throw new IllegalArgumentException("Invalid OTP");
        }
    }
}
