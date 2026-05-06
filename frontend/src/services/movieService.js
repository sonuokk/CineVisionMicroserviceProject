import { apiClient } from "./apiClient";

export class MovieService {

    getAllDisplayingMovies() {
        return apiClient.get("/movie/movies/displayingMovies");
    }

    getAllComingSoonMovies() {
        return apiClient.get("/movie/movies/comingSoonMovies");
    }

    getMovieById(movieId) {
        return apiClient.get("/movie/movies/" + movieId);
    }

    addMovie(movieDto) {
        return apiClient.post("/movie/movies/add", movieDto);
    }
}
