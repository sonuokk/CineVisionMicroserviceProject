package com.kaankaplan.movieService.config;

import com.kaankaplan.movieService.dao.*;
import com.kaankaplan.movieService.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

@Configuration
@RequiredArgsConstructor
public class SampleMovieDataConfig {

    private final MovieDao movieDao;
    private final CategoryDao categoryDao;
    private final DirectorDao directorDao;
    private final MovieImageDao movieImageDao;
    private final CityDao cityDao;
    private final SaloonDao saloonDao;
    private final MovieSaloonTimeDao movieSaloonTimeDao;
    private final ActorDao actorDao;

    @Bean
    public CommandLineRunner bootstrapSampleMovies() {
        return args -> {
            if (movieDao.count() > 0) {
                return;
            }

            Category action = new Category();
            action.setCategoryName("Action");
            action = categoryDao.save(action);

            Category drama = new Category();
            drama.setCategoryName("Drama");
            drama = categoryDao.save(drama);

            Director josephKosinski = Director.builder().directorName("Joseph Kosinski").build();
            josephKosinski = directorDao.save(josephKosinski);

            Director justinKurzel = Director.builder().directorName("Justin Kurzel").build();
            justinKurzel = directorDao.save(justinKurzel);

            Movie topGun = Movie.builder()
                    .movieName("Top Gun: Maverick")
                    .description("After more than thirty years of service as one of the Navy's top aviators, Maverick trains a new generation of pilots for a mission that demands courage, precision, and sacrifice.")
                    .duration(131)
                    .releaseDate(dateDaysAgo(30))
                    .movieTrailerUrl("https://www.youtube.com/embed/giXco2jaZ_4")
                    .category(action)
                    .director(josephKosinski)
                    .isDisplay(true)
                    .build();
            topGun = movieDao.save(topGun);
            addImage(topGun, "/images/topgun.png");
            addActors(topGun, "Tom Cruise", "Miles Teller", "Jennifer Connelly");
            addCityWithShows(topGun, "Delhi", "CineSaga Connaught Place", "10:30", "14:15", "19:00");
            addCityWithShows(topGun, "Mumbai", "CineSaga Bandra", "11:00", "16:20", "21:10");

            Movie assassin = Movie.builder()
                    .movieName("Assassin's Creed")
                    .description("A man discovers his connection to a secret order and relives the memories of his ancestor through advanced technology, entering a conflict that spans centuries.")
                    .duration(115)
                    .releaseDate(dateDaysAgo(20))
                    .movieTrailerUrl("https://www.youtube.com/embed/4haJD6W136c")
                    .category(action)
                    .director(justinKurzel)
                    .isDisplay(true)
                    .build();
            assassin = movieDao.save(assassin);
            addImage(assassin, "/images/assasin.png");
            addActors(assassin, "Michael Fassbender", "Marion Cotillard", "Jeremy Irons");
            addCityWithShows(assassin, "Bengaluru", "CineSaga Orion Mall", "12:00", "17:30", "22:00");

            Movie comingSoon = Movie.builder()
                    .movieName("The Last Premiere")
                    .description("A cinema owner prepares for one final grand premiere while reconnecting with the community that made the theater legendary.")
                    .duration(124)
                    .releaseDate(dateDaysFromNow(20))
                    .movieTrailerUrl("")
                    .category(drama)
                    .director(josephKosinski)
                    .isDisplay(false)
                    .build();
            comingSoon = movieDao.save(comingSoon);
            addImage(comingSoon, "/clapboard.png");
        };
    }

    private void addImage(Movie movie, String imageUrl) {
        MovieImage image = new MovieImage();
        image.setMovie(movie);
        image.setImageUrl(imageUrl);
        movieImageDao.save(image);
    }

    private void addActors(Movie movie, String... names) {
        for (String name : names) {
            Actor actor = Actor.builder()
                    .actorName(name)
                    .movie(movie)
                    .build();
            actorDao.save(actor);
        }
    }

    private void addCityWithShows(Movie movie, String cityName, String saloonName, String... showTimes) {
        City city = City.builder()
                .cityName(cityName)
                .movie(movie)
                .build();
        city = cityDao.save(city);

        Saloon saloon = new Saloon();
        saloon.setSaloonName(saloonName);
        saloon.setCity(city);
        saloon = saloonDao.save(saloon);

        for (String showTime : showTimes) {
            MovieSaloonTime movieSaloonTime = new MovieSaloonTime();
            movieSaloonTime.setMovie(movie);
            movieSaloonTime.setSaloon(saloon);
            movieSaloonTime.setMovieBeginTime(showTime);
            movieSaloonTimeDao.save(movieSaloonTime);
        }
    }

    private Date dateDaysAgo(int days) {
        return Date.from(LocalDate.now().minusDays(days)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant());
    }

    private Date dateDaysFromNow(int days) {
        return Date.from(LocalDate.now().plusDays(days)
                .atStartOfDay(ZoneId.systemDefault())
                .toInstant());
    }
}
