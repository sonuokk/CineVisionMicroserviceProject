import { apiClient } from "./apiClient";

export class SaloonTimeService {

    getMovieSaloonTimeSaloonAndMovieId(saloonId, movieId) {
        return apiClient.get("/movie/movieSaloonTimes/getMovieSaloonTimeSaloonAndMovieId/" + saloonId + "/" + movieId);
    }

}
