import { apiClient } from "./apiClient";

export class CityService {

    getCitiesByMovieId(movieId) {
        return apiClient.get("/movie/cities/getCitiesByMovieId/" + movieId);
    }

    getall() {
        return apiClient.get("/movie/cities/getall");
    }

    getTheaterLibrary() {
        return apiClient.get("/movie/cities/theaters/library");
    }

    addCity(cityDto) {
        return apiClient.post("/movie/cities/add", cityDto);
    }

    addTheaterToLibrary(theaterDto) {
        return apiClient.post("/movie/cities/theaters/library", theaterDto);
    }

    addTheater(theaterDto) {
        return apiClient.post("/movie/cities/theaters", theaterDto);
    }

    deleteTheater(movieId, cityId, theaterId) {
        return apiClient.delete(`/movie/cities/${cityId}/theaters/${theaterId}`, {
            params: { movieId }
        });
    }

    deleteCity(movieId, cityId) {
        return apiClient.delete(`/movie/cities/${cityId}`, {
            params: { movieId }
        });
    }
}
