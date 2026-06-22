package com.doffeii.movieService.config;

import com.doffeii.movieService.dao.CategoryDao;
import com.doffeii.movieService.dao.DirectorDao;
import com.doffeii.movieService.dao.MovieDao;
import com.doffeii.movieService.dao.MovieSaloonTimeDao;
import com.doffeii.movieService.dao.PaymentCardDetailDao;
import com.doffeii.movieService.dao.SaloonDao;
import com.doffeii.movieService.dao.TicketBookingDao;
import com.doffeii.movieService.entity.Category;
import com.doffeii.movieService.entity.Director;
import com.doffeii.movieService.entity.Movie;
import com.doffeii.movieService.entity.MovieImage;
import com.doffeii.movieService.entity.MovieSaloonTime;
import com.doffeii.movieService.entity.PaymentCardDetail;
import com.doffeii.movieService.entity.Saloon;
import com.doffeii.movieService.entity.TicketBooking;
import com.doffeii.movieService.entity.TicketBookingSeat;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class MongoDummyDataConfig {

    private final CategoryDao categoryDao;
    private final DirectorDao directorDao;
    private final MovieDao movieDao;
    private final SaloonDao saloonDao;
    private final MovieSaloonTimeDao movieSaloonTimeDao;
    private final TicketBookingDao ticketBookingDao;
    private final PaymentCardDetailDao paymentCardDetailDao;

    @Bean
    @Order(1)
    CommandLineRunner mongoDummyDataRunner() {
        return args -> {
            if (movieDao.count() < 6) {
                seedMoviesTheatresAndShowtimes();
            }
            if (ticketBookingDao.count() == 0) {
                seedBookingsAndPayments();
            }
        };
    }

    private void seedMoviesTheatresAndShowtimes() {
        Category action = categoryDao.save(new Category(1, "Action", null));
        Category drama = categoryDao.save(new Category(2, "Drama", null));
        Category scifi = categoryDao.save(new Category(3, "Sci-Fi", null));

        Director nolan = directorDao.save(Director.builder().directorId(1).directorName("Christopher Nolan").build());
        Director gerwig = directorDao.save(Director.builder().directorId(2).directorName("Greta Gerwig").build());
        Director villeneuve = directorDao.save(Director.builder().directorId(3).directorName("Denis Villeneuve").build());
        Director cameron = directorDao.save(Director.builder().directorId(4).directorName("James Cameron").build());
        Director reeves = directorDao.save(Director.builder().directorId(5).directorName("Matt Reeves").build());
        Director santos = directorDao.save(Director.builder().directorId(6).directorName("Joaquim Dos Santos").build());

        Movie interstellar = movie(1, "Interstellar", "A space epic about survival, time, and love.", 169,
                LocalDate.of(2014, 11, 7), true, action, nolan,
                "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg");
        Movie barbie = movie(2, "Barbie", "A bright, funny trip from Barbieland to the real world.", 114,
                LocalDate.of(2023, 7, 21), true, drama, gerwig,
                "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg");
        Movie dune = movie(3, "Dune: Part Two", "Paul Atreides joins the Fremen and faces his destiny.", 166,
                LocalDate.of(2024, 3, 1), true, scifi, villeneuve,
                "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg");
        Movie avatar = movie(4, "Avatar: Fire and Ash", "The next Pandora chapter prepared for the big screen.", 180,
                LocalDate.of(2026, 12, 18), false, scifi, cameron,
                "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg");
        Movie batman = movie(5, "The Batman Part II", "Gotham waits for its next dark detective story.", 165,
                LocalDate.of(2027, 10, 1), false, action, reeves,
                "https://image.tmdb.org/t/p/w500/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg");
        Movie spiderVerse = movie(6, "Spider-Man: Beyond the Spider-Verse",
                "Miles Morales returns for another animated multiverse event.", 140,
                LocalDate.of(2027, 6, 4), false, action, santos,
                "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg");

        movieDao.saveAll(List.of(interstellar, barbie, dune, avatar, batman, spiderVerse));

        Saloon bandra = theatre(1, "CineSaga Bandra Luxe", "Mumbai", interstellar);
        Saloon saket = theatre(2, "CineSaga Saket Select", "Delhi", barbie);
        Saloon orion = theatre(3, "CineSaga Orion Mall", "Bengaluru", dune);
        saloonDao.saveAll(List.of(bandra, saket, orion));

        movieSaloonTimeDao.saveAll(List.of(
                showtime(1, interstellar, bandra, "10:30"),
                showtime(2, interstellar, bandra, "20:15"),
                showtime(3, barbie, saket, "13:45"),
                showtime(4, barbie, saket, "22:40"),
                showtime(5, dune, orion, "17:00"),
                showtime(6, dune, orion, "20:15")
        ));
    }

    private void seedBookingsAndPayments() {
        TicketBooking bookingOne = booking("CV-DEMO100", "Interstellar", "CineSaga Bandra Luxe", "2026-05-10",
                "20:15", "aarav.mehra@example.com", "Aarav Mehra", "A1 A2", BigDecimal.valueOf(500));
        TicketBooking bookingTwo = booking("CV-DEMO200", "Dune: Part Two", "CineSaga Orion Mall", "2026-05-11",
                "17:00", "riya.sen@example.com", "Riya Sen", "C3 C4", BigDecimal.valueOf(500));
        ticketBookingDao.saveAll(List.of(bookingOne, bookingTwo));

        paymentCardDetailDao.save(payment("PAY-CV-DEMO100", bookingOne, BigDecimal.valueOf(500), "CARD"));
        paymentCardDetailDao.save(payment("PAY-CV-DEMO200", bookingTwo, BigDecimal.valueOf(500), "WALLET"));
    }

    private Movie movie(int id, String name, String description, int duration, LocalDate releaseDate,
                        boolean display, Category category, Director director, String imageUrl) {
        Movie movie = Movie.builder()
                .movieId(id)
                .movieName(name)
                .description(description)
                .duration(duration)
                .releaseDate(Date.from(releaseDate.atStartOfDay(ZoneId.systemDefault()).toInstant()))
                .isDisplay(display)
                .movieTrailerUrl("")
                .category(category)
                .director(director)
                .build();
        movie.setImage(new MovieImage(id, imageUrl, null));
        return movie;
    }

    private Saloon theatre(int id, String name, String cityName, Movie movie) {
        return new Saloon(id, name, com.doffeii.movieService.entity.City.builder()
                .cityId(id)
                .cityName(cityName)
                .movie(movie)
                .build());
    }

    private MovieSaloonTime showtime(int id, Movie movie, Saloon theatre, String startTime) {
        return new MovieSaloonTime(id, startTime, theatre, movie);
    }

    private TicketBooking booking(String code, String movieName, String theatreName, String day, String startTime,
                                  String email, String fullName, String seats, BigDecimal totalAmount) {
        TicketBooking booking = new TicketBooking();
        booking.setBookingCode(code);
        booking.setMovieName(movieName);
        booking.setSaloonName(theatreName);
        booking.setMovieDay(day);
        booking.setMovieStartTime(startTime);
        booking.setEmail(email);
        booking.setFullName(fullName);
        booking.setPhone("+919999999999");
        booking.setAdultTicketCount(2);
        booking.setTotalAmount(totalAmount);
        booking.setStatus("CONFIRMED");
        booking.setCreatedAt(Instant.now());
        for (String seatNumber : seats.split(" ")) {
            TicketBookingSeat seat = new TicketBookingSeat();
            seat.setMovieName(movieName);
            seat.setSaloonName(theatreName);
            seat.setMovieDay(day);
            seat.setMovieStartTime(startTime);
            seat.setSeatNumber(seatNumber);
            booking.addSeat(seat);
        }
        return booking;
    }

    private PaymentCardDetail payment(String code, TicketBooking booking, BigDecimal amount, String mode) {
        PaymentCardDetail payment = new PaymentCardDetail();
        payment.setPaymentCode(code);
        payment.setBooking(booking);
        payment.setAmount(amount);
        payment.setPaymentMode(mode);
        payment.setStatus("PAID");
        payment.setCardHolderName(booking.getFullName());
        payment.setMaskedCardNumber("**** **** **** 4242");
        payment.setCardNumberHash("dummy-hash-" + code);
        payment.setCardExpiry("12/30");
        payment.setCardBrand("Visa");
        payment.setCreatedAt(Instant.now());
        return payment;
    }
}
