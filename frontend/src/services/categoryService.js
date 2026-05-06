import { apiClient } from "./apiClient"

export class CategoryService{
    getall() {
        return apiClient.get("/movie/categories/getall")
    }
}
