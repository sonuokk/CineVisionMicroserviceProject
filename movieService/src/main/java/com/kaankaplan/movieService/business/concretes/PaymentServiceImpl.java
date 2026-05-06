package com.kaankaplan.movieService.business.concretes;

import com.kaankaplan.movieService.business.abstracts.PaymentService;
import com.kaankaplan.movieService.dao.TicketBookingDao;
import com.kaankaplan.movieService.dao.TicketBookingSeatDao;
import com.kaankaplan.movieService.entity.TicketBooking;
import com.kaankaplan.movieService.entity.TicketBookingSeat;
import com.kaankaplan.movieService.entity.dto.EmailMessageKafkaDto;
import com.kaankaplan.movieService.entity.dto.TicketBookingResponseDto;
import com.kaankaplan.movieService.entity.dto.TicketInformationDto;
import com.kaankaplan.movieService.kafka.KafkaProducer;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final KafkaProducer kafkaProducer;
    private final TicketBookingDao ticketBookingDao;
    private final TicketBookingSeatDao ticketBookingSeatDao;

    @Value("${app.mail.sender:no-reply@cinesaga.local}")
    private String ticketSenderEmail;

    @Override
    public TicketBookingResponseDto sendTicketDetail(TicketInformationDto ticketInformationDto) {
        Set<String> seats = parseSeatNumbers(ticketInformationDto.getChairNumbers());
        int requestedTickets = ticketInformationDto.getAdultTicketCount() + ticketInformationDto.getStudentTicketCount();
        if (requestedTickets <= 0) {
            requestedTickets = seats.size();
            ticketInformationDto.setAdultTicketCount(seats.size());
        }
        if (requestedTickets != seats.size()) {
            throw new IllegalArgumentException("Choose one seat for every ticket");
        }

        BigDecimal totalAmount = BigDecimal.valueOf(ticketInformationDto.getAdultTicketCount()).multiply(BigDecimal.valueOf(25))
                .add(BigDecimal.valueOf(ticketInformationDto.getStudentTicketCount()).multiply(BigDecimal.valueOf(15)));

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

        for (String seatNumber : seats) {
            TicketBookingSeat seat = new TicketBookingSeat();
            seat.setMovieName(booking.getMovieName());
            seat.setSaloonName(booking.getSaloonName());
            seat.setMovieDay(booking.getMovieDay());
            seat.setMovieStartTime(booking.getMovieStartTime());
            seat.setSeatNumber(seatNumber);
            booking.addSeat(seat);
        }

        try {
            booking = ticketBookingDao.saveAndFlush(booking);
        } catch (DataIntegrityViolationException exception) {
            throw new IllegalArgumentException("One or more selected seats are already booked. Please choose different seats.");
        }

        String chairNumbers = String.join(" ", seats);

        EmailMessageKafkaDto emailMessage = EmailMessageKafkaDto.builder()
                .sender(ticketSenderEmail)
                .recipient(booking.getEmail())
                .subtitle("CineSaga Ticket Details")
                .fullName(booking.getFullName())
                .movieName(booking.getMovieName())
                .movieDay(booking.getMovieDay())
                .movieStartTime(booking.getMovieStartTime())
                .saloonName(booking.getSaloonName())
                .chairNumbers(chairNumbers)
                .build();

        try {
            kafkaProducer.sendMessage(emailMessage);
        } catch (RuntimeException exception) {
            // Booking should still succeed in local/demo mode even if Kafka or email is offline.
        }

        return TicketBookingResponseDto.builder()
                .status("SUCCESS")
                .message("Ticket booked successfully. Details will be emailed when mail credentials are configured.")
                .bookingCode(booking.getBookingCode())
                .movieName(booking.getMovieName())
                .saloonName(booking.getSaloonName())
                .movieDay(booking.getMovieDay())
                .movieStartTime(booking.getMovieStartTime())
                .chairNumbers(chairNumbers)
                .totalAmount(totalAmount.toPlainString())
                .build();
    }

    @Override
    public List<String> getBookedSeats(String movieName, String saloonName, String movieDay, String movieStartTime) {
        return ticketBookingSeatDao.findBookedSeats(
                movieName.trim(),
                saloonName.trim(),
                movieDay.trim(),
                movieStartTime.trim()
        );
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
