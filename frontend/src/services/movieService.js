import { apiClient } from "./apiClient";

export class MovieService {

    getAllDisplayingMovies() {
        return apiClient.get("/movie/movies/displayingMovies");
    }

    getAllComingSoonMovies() {
        return apiClient.get("/movie/movies/comingSoonMovies");
    }

    getAllMovies() {
        return apiClient.get("/movie/movies/all");
    }

    getMoviesByCity(cityName) {
        return apiClient.get("/movie/movies/city/" + encodeURIComponent(cityName));
    }

    getMovieById(movieId) {
        return apiClient.get("/movie/movies/" + movieId);
    }

    addMovie(movieDto) {
        return apiClient.post("/movie/movies/add", movieDto);
    }

    deleteMovie(movieId) {
        return apiClient.delete("/admin/movies/" + movieId);
    }
}
