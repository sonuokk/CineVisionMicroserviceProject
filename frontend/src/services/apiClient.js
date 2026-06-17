import axios from "axios";

export const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL
});

apiClient.interceptors.request.use((config) => {
    const storedUser = sessionStorage.getItem("cineSagaUser");
    if (storedUser) {
        let user = null;
        try {
            user = JSON.parse(storedUser);
        } catch {
            sessionStorage.removeItem("cineSagaUser");
        }
        if (user?.token) {
            config.headers.Authorization = `Bearer ${user.token}`;
        }
    }
    return config;
});
