import { apiClient } from "./apiClient";

export class CityService {

    getCitiesByMovieId(movieId) {
        return apiClient.get("/movie/cities/getCitiesByMovieId/" + movieId);
    }

    getall() {
        return apiClient.get("/movie/cities/getall");
    }

    addCity(cityDto) {
        return apiClient.post("/movie/cities/add", cityDto);
    }
}
