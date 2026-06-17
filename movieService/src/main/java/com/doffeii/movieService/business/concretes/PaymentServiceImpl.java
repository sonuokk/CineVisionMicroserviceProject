package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.PaymentService;
import com.doffeii.movieService.dao.CommentDao;
import com.doffeii.movieService.dao.MovieDao;
import com.doffeii.movieService.dao.PaymentCardDetailDao;
import com.doffeii.movieService.dao.TicketBookingDao;
import com.doffeii.movieService.entity.PaymentCardDetail;
import com.doffeii.movieService.entity.TicketBooking;
import com.doffeii.movieService.entity.TicketBookingSeat;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.dto.CancelTicketRequestDto;
import com.doffeii.movieService.entity.dto.TicketBookingResponseDto;
import com.doffeii.movieService.entity.dto.TicketInformationDto;
import com.doffeii.movieService.entity.mongo.MovieDocument;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final TicketBookingDao ticketBookingDao;
    private final PaymentCardDetailDao paymentCardDetailDao;
    private final MovieDao movieDao;
    private final CommentDao commentDao;
    private final WebClient.Builder webClientBuilder;
    private final TicketEmailSender ticketEmailSender;

    @Value("${app.payment.card-hash-secret:cinesaga-local-card-secret}")
    private String cardHashSecret;

    @Value("${app.ticket.cancellation-window-minutes:30}")
    private long cancellationWindowMinutes;

    @Value("${app.internal.cleanup-token:cinesaga-internal-cleanup-token}")
    private String cleanupToken;

    @Override
    public TicketBookingResponseDto sendTicketDetail(TicketInformationDto ticketInformationDto, String authorizationHeader) {
        Set<String> seats = parseSeatNumbers(ticketInformationDto.getChairNumbers());
        int requestedTickets = ticketInformationDto.getAdultTicketCount() + ticketInformationDto.getStudentTicketCount();
        if (requestedTickets <= 0) {
            requestedTickets = seats.size();
            ticketInformationDto.setAdultTicketCount(seats.size());
        }
        if (requestedTickets != seats.size()) {
            throw new IllegalArgumentException("Choose one seat for every ticket");
        }
        String normalizedCardNumber = normalizeCardNumber(ticketInformationDto.getCardNumber());

        BigDecimal totalAmount = BigDecimal.valueOf(ticketInformationDto.getAdultTicketCount()).multiply(BigDecimal.valueOf(250))
                .add(BigDecimal.valueOf(ticketInformationDto.getStudentTicketCount()).multiply(BigDecimal.valueOf(150)));

        TicketBooking booking = new TicketBooking();
        booking.setMovieName(ticketInformationDto.getMovieName().trim());
        booking.setSaloonName(ticketInformationDto.getSaloonName().trim());
        booking.setMovieDay(ticketInformationDto.getMovieDay().trim());
        booking.setMovieStartTime(ticketInformationDto.getMovieStartTime().trim());
        booking.setEmail(ticketInformationDto.getEmail().trim().toLowerCase());
        booking.setFullName(ticketInformationDto.getFullName().trim());
        booking.setPhone(normalizeIndianPhoneNumber(ticketInformationDto.getPhone()));
        booking.setAdultTicketCount(ticketInformationDto.getAdultTicketCount());
        booking.setStudentTicketCount(ticketInformationDto.getStudentTicketCount());
        booking.setTotalAmount(totalAmount);
        booking.setStatus("CONFIRMED");
        booking.ensureBookingMetadata();

        List<String> alreadyBookedSeats = findBookedSeats(
                booking.getMovieName(),
                booking.getSaloonName(),
                booking.getMovieDay(),
                booking.getMovieStartTime()
        );
        for (String seatNumber : seats) {
            if (alreadyBookedSeats.contains(seatNumber)) {
                throw new IllegalArgumentException("One or more selected seats are already booked. Please choose different seats.");
            }
            TicketBookingSeat seat = new TicketBookingSeat();
            seat.setMovieName(booking.getMovieName());
            seat.setSaloonName(booking.getSaloonName());
            seat.setMovieDay(booking.getMovieDay());
            seat.setMovieStartTime(booking.getMovieStartTime());
            seat.setSeatNumber(seatNumber);
            booking.addSeat(seat);
        }

        booking = ticketBookingDao.save(booking);

        PaymentCardDetail paymentCardDetail = new PaymentCardDetail();
        paymentCardDetail.setBooking(booking);
        paymentCardDetail.setPaymentCode("PAY-" + booking.getBookingCode());
        paymentCardDetail.setAmount(totalAmount);
        paymentCardDetail.setPaymentMode(resolvePaymentMode(ticketInformationDto.getPaymentMode()));
        paymentCardDetail.setStatus("PAID");
        paymentCardDetail.setCardHolderName(resolveCardHolderName(ticketInformationDto));
        paymentCardDetail.setMaskedCardNumber(maskCardNumber(normalizedCardNumber));
        paymentCardDetail.setCardNumberHash(hashCardNumber(resolveHashSource(normalizedCardNumber, booking.getBookingCode())));
        paymentCardDetail.setCardExpiry(resolveCardExpiry(ticketInformationDto.getCardExpiry()));
        paymentCardDetail.setCardBrand(resolveCardBrand(normalizedCardNumber));
        paymentCardDetailDao.save(paymentCardDetail);

        String chairNumbers = String.join(" ", seats);
        MovieDocument movieDocument = resolveMovieDocument(ticketInformationDto);
        String qrCodePayload = buildQrCodePayload(booking, chairNumbers);
        appendBookedMovieToUser(booking, movieDocument, chairNumbers, qrCodePayload, authorizationHeader);

        String emailStatus = "SENT";
        String emailMessage = "Ticket email sent to " + booking.getEmail() + ".";
        try {
            ticketEmailSender.sendBookingTicket(booking, chairNumbers, totalAmount, qrCodePayload);
        } catch (RuntimeException exception) {
            emailStatus = "FAILED";
            emailMessage = "Ticket booked, but confirmation email could not be sent: " + conciseError(exception);
        }

        return TicketBookingResponseDto.builder()
                .status("SUCCESS")
                .message(emailStatus.equals("SENT")
                        ? "Ticket booked successfully. Confirmation email sent to " + booking.getEmail() + "."
                        : "Ticket booked successfully, but confirmation email could not be sent.")
                .bookingCode(booking.getBookingCode())
                .movieName(booking.getMovieName())
                .saloonName(booking.getSaloonName())
                .movieDay(booking.getMovieDay())
                .movieStartTime(booking.getMovieStartTime())
                .chairNumbers(chairNumbers)
                .totalAmount(totalAmount.toPlainString())
                .qrCodePayload(qrCodePayload)
                .recipientEmail(booking.getEmail())
                .emailStatus(emailStatus)
                .emailMessage(emailMessage)
                .build();
    }

    @Override
    public TicketBookingResponseDto cancelTicket(CancelTicketRequestDto cancelTicketRequestDto, String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Sign in is required to cancel a ticket");
        }

        TicketBooking booking = ticketBookingDao.findByBookingCode(cancelTicketRequestDto.getBookingCode().trim());
        if (booking == null) {
            throw new IllegalArgumentException("Booking was not found");
        }
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            throw new IllegalArgumentException("Ticket is already cancelled");
        }
        if (booking.getCreatedAt() != null
                && Instant.now().isAfter(booking.getCreatedAt().plusSeconds(cancellationWindowMinutes * 60))) {
            throw new IllegalArgumentException("Tickets can be cancelled within " + cancellationWindowMinutes + " minutes of booking");
        }
        ensureCustomerOwnsBooking(booking, authorizationHeader);

        Instant cancelledAt = Instant.now();
        booking.setStatus("CANCELLED");
        booking.setCancelledAt(cancelledAt);
        ticketBookingDao.save(booking);

        PaymentCardDetail paymentCardDetail = paymentCardDetailDao.findByBookingBookingCode(booking.getBookingCode());
        if (paymentCardDetail != null) {
            paymentCardDetail.setStatus("REFUNDED");
            paymentCardDetail.setRefundedAt(cancelledAt);
            paymentCardDetailDao.save(paymentCardDetail);
        }
        markBookedMovieCancelledInUserService(booking.getBookingCode(), authorizationHeader);

        return TicketBookingResponseDto.builder()
                .status("CANCELLED")
                .message("Ticket cancelled successfully.")
                .bookingCode(booking.getBookingCode())
                .movieName(booking.getMovieName())
                .saloonName(booking.getSaloonName())
                .movieDay(booking.getMovieDay())
                .movieStartTime(booking.getMovieStartTime())
                .totalAmount(booking.getTotalAmount() == null ? null : booking.getTotalAmount().toPlainString())
                .cancelledAt(cancelledAt.toString())
                .build();
    }

    @Override
    public List<String> getBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime) {
        return findBookedSeats(
                movieName.trim(),
                saloonName.trim(),
                movieDay.trim(),
                movieStartTime.trim()
        );
    }

    @Override
    public void purgeUserRecords(String email, String userId, String authorizationHeader) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        if (normalizedEmail.isBlank()) {
            throw new IllegalArgumentException("Email is required");
        }
        ensureCanPurgeUserRecords(normalizedEmail, authorizationHeader);

        List<TicketBooking> bookings = ticketBookingDao.findByEmailIgnoreCase(normalizedEmail);
        List<String> bookingCodes = bookings.stream()
                .map(TicketBooking::getBookingCode)
                .filter(code -> code != null && !code.isBlank())
                .toList();

        if (!bookingCodes.isEmpty()) {
            paymentCardDetailDao.deleteByBookingBookingCodeIn(bookingCodes);
            ticketBookingDao.deleteAll(bookings);
        }

        if (userId != null && !userId.isBlank()) {
            commentDao.deleteByCommentByUserId(userId.trim());
        }
    }

    private List<String> findBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime) {
        return ticketBookingDao.findByMovieNameAndSaloonNameAndMovieDayAndMovieStartTimeAndStatusIgnoreCase(
                        movieName,
                        saloonName,
                        movieDay,
                        movieStartTime,
                        "CONFIRMED"
                ).stream()
                .filter(booking -> booking.getSeats() != null)
                .flatMap(booking -> booking.getSeats().stream())
                .map(TicketBookingSeat::getSeatNumber)
                .toList();
    }

    private Set<String> parseSeatNumbers(String chairNumbers) {
        Set<String> seats = Arrays.stream(chairNumbers.trim().split("[,\\s]+"))
                .map(String::trim)
                .filter(seat -> !seat.isBlank())
                .map(String::toUpperCase)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (seats.isEmpty()) {
            throw new IllegalArgumentException("Choose at least one seat");
        }

        for (String seat : seats) {
            if (!seat.matches("[A-F][1-8]")) {
                throw new IllegalArgumentException("Invalid seat number: " + seat);
            }
        }

        return seats;
    }

    private MovieDocument resolveMovieDocument(TicketInformationDto ticketInformationDto) {
        Movie movie = ticketInformationDto.getMovieId() > 0
                ? movieDao.getMovieByMovieId(ticketInformationDto.getMovieId())
                : null;

        return MovieDocument.builder()
                .movieId(movie != null && movie.getMovieId() != null ? movie.getMovieId() : ticketInformationDto.getMovieId())
                .movieName(movie != null ? movie.getMovieName() : ticketInformationDto.getMovieName())
                .description(movie != null ? movie.getDescription() : null)
                .duration(movie != null ? movie.getDuration() : 0)
                .releaseDate(movie != null ? movie.getReleaseDate() : null)
                .display(movie != null && movie.isDisplay())
                .categoryId(movie != null && movie.getCategory() != null && movie.getCategory().getCategoryId() != null
                        ? movie.getCategory().getCategoryId()
                        : 0)
                .categoryName(movie != null && movie.getCategory() != null ? movie.getCategory().getCategoryName() : null)
                .movieImageUrl(movie != null && movie.getImage() != null ? movie.getImage().getImageUrl() : null)
                .movieTrailerUrl(movie != null ? movie.getMovieTrailerUrl() : null)
                .directorName(movie != null && movie.getDirector() != null ? movie.getDirector().getDirectorName() : null)
                .syncedAt(Instant.now())
                .build();
    }

    private void appendBookedMovieToUser(TicketBooking booking, MovieDocument movieDocument, String chairNumbers,
                                         String qrCodePayload, String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return;
        }

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("bookingCode", booking.getBookingCode());
            payload.put("movie", movieDocument);
            payload.put("saloonName", booking.getSaloonName());
            payload.put("theatreName", booking.getSaloonName());
            payload.put("movieDay", booking.getMovieDay());
            payload.put("movieStartTime", booking.getMovieStartTime());
            payload.put("showtimeStartTime", booking.getMovieStartTime());
            payload.put("seats", Arrays.asList(chairNumbers.split("\\s+")));
            payload.put("adultTicketCount", booking.getAdultTicketCount());
            payload.put("studentTicketCount", booking.getStudentTicketCount());
            payload.put("totalAmount", booking.getTotalAmount());
            payload.put("bookedAt", booking.getCreatedAt());
            payload.put("status", booking.getStatus());
            payload.put("cancelledAt", booking.getCancelledAt());
            payload.put("qrCodePayload", qrCodePayload);

            webClientBuilder.build().post()
                    .uri("http://USERSERVICE/api/user/users/me/booked-movies")
                    .header("Authorization", authorizationHeader)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
        } catch (RuntimeException exception) {
            // Ticket booking remains valid even if the user booking snapshot cannot be appended.
        }
    }

    private void markBookedMovieCancelledInUserService(String bookingCode, String authorizationHeader) {
        try {
            webClientBuilder.build().post()
                    .uri("http://USERSERVICE/api/user/users/me/booked-movies/" + bookingCode + "/cancel")
                    .header("Authorization", authorizationHeader)
                    .retrieve()
                    .bodyToMono(Void.class)
                    .block();
        } catch (RuntimeException exception) {
            // The canonical booking is cancelled even if the profile snapshot update is delayed.
        }
    }

    private void ensureCustomerOwnsBooking(TicketBooking booking, String authorizationHeader) {
        Map<?, ?> currentUser = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/me")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Object email = currentUser == null ? null : currentUser.get("email");
        if (email == null || !booking.getEmail().equalsIgnoreCase(email.toString())) {
            throw new IllegalArgumentException("You can cancel only your own ticket");
        }
    }

    private void ensureCanPurgeUserRecords(String email, String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new IllegalArgumentException("Sign in is required to purge user records");
        }

        if (authorizationHeader.startsWith("InternalCleanup ")) {
            String token = authorizationHeader.substring("InternalCleanup ".length()).trim();
            if (cleanupToken.equals(token)) {
                return;
            }
            throw new IllegalArgumentException("Internal cleanup token is invalid");
        }

        Map<?, ?> currentUser = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/me")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        Object currentEmail = currentUser == null ? null : currentUser.get("email");
        if (currentEmail != null && email.equalsIgnoreCase(currentEmail.toString())) {
            return;
        }

        Boolean isAdmin = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", authorizationHeader)
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();

        if (!Boolean.TRUE.equals(isAdmin)) {
            throw new IllegalArgumentException("Only admins can purge user records");
        }
    }

    private String buildQrCodePayload(TicketBooking booking, String chairNumbers) {
        return "CINESAGA|booking=" + safe(booking.getBookingCode())
                + "|movie=" + safe(booking.getMovieName())
                + "|show=" + safe(booking.getMovieDay()) + " " + safe(booking.getMovieStartTime())
                + "|seats=" + safe(chairNumbers);
    }

    private String safe(String value) {
        return value == null ? "" : value.replace("|", " ").trim();
    }

    private String conciseError(Throwable exception) {
        Throwable root = exception;
        while (root.getCause() != null) {
            root = root.getCause();
        }
        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            message = root.getClass().getSimpleName();
        }
        return message.length() > 180 ? message.substring(0, 177) + "..." : message;
    }

    private String normalizeCardNumber(String cardNumber) {
        return cardNumber == null ? "" : cardNumber.replaceAll("[^0-9]", "");
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber.length() < 4) {
            return "DUMMY PAYMENT";
        }
        String lastFour = cardNumber.substring(cardNumber.length() - 4);
        return "**** **** **** " + lastFour;
    }

    private String resolveHashSource(String cardNumber, String bookingCode) {
        if (cardNumber.length() >= 4) {
            return cardNumber;
        }
        return "DUMMY_PAYMENT:" + bookingCode;
    }

    private String hashCardNumber(String hashSource) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest((cardHashSecret + ":" + hashSource).getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte hashByte : hashBytes) {
                hash.append(String.format("%02x", hashByte));
            }
            return hash.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Card hashing is not available", exception);
        }
    }

    private String resolveCardBrand(String cardNumber) {
        if (cardNumber.length() < 4) {
            return "Dummy";
        }
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

    private String resolveCardHolderName(TicketInformationDto ticketInformationDto) {
        if (ticketInformationDto.getCardHolderName() != null && !ticketInformationDto.getCardHolderName().isBlank()) {
            return ticketInformationDto.getCardHolderName().trim();
        }
        return ticketInformationDto.getFullName().trim();
    }

    private String resolvePaymentMode(String paymentMode) {
        if (paymentMode == null || paymentMode.isBlank()) {
            return "CARD";
        }
        return paymentMode.trim().toUpperCase();
    }

    private String resolveCardExpiry(String cardExpiry) {
        if (cardExpiry != null && !cardExpiry.isBlank()) {
            return cardExpiry.trim();
        }
        return "DUMMY";
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
}
