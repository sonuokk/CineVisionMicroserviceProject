import { apiClient } from "./apiClient";

export class MovieImageService {

    addMovieImage(imageDto) {
        return apiClient.post("/movie/images/add", imageDto);
    }
}
