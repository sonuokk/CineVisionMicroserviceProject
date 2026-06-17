import { apiClient } from "./apiClient"

export class CategoryService{
    getall() {
        return apiClient.get("/movie/categories/getall")
    }

    add(category) {
        return apiClient.post("/movie/categories/add", category)
    }
}
