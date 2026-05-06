import { apiClient } from "./apiClient";

export class ActorService {

    getActorsByMovieId(movieId) {
        return apiClient.get("/movie/actors/getActorsByMovieId/" + movieId);
    }

    getall() {
        return apiClient.get("/movie/actors/getall");
    }
    
    addActor(actorDto) {
        return apiClient.post("/movie/actors/add", actorDto);
    }
}
