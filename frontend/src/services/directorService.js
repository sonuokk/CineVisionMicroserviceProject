import { apiClient } from "./apiClient"

export class DirectorService{
    getall() {
        return apiClient.get("/movie/directors/getall")
    }

    add(director) {
        return apiClient.post("/movie/directors/add", director);
    }
}
