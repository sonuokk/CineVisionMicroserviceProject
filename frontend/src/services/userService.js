import { apiClient } from "./apiClient";

export class UserService {

    addCustomer(customer) {
        return apiClient.post("/auth/signup/request-otp", customer);
    }

    verifyCustomerOtp(payload) {
        return apiClient.post("/auth/signup/verify-otp", payload);
    }

    requestPasswordResetOtp(payload) {
        return apiClient.post("/auth/password/forgot", payload);
    }

    resetPassword(payload) {
        return apiClient.post("/auth/password/reset", payload);
    }

    getAllUsers() {
        return apiClient.get("/user/users/admin/all");
    }

    promoteUserToAdmin(email) {
        return apiClient.post("/admin/users/promote", { email });
    }

    getProfile() {
        return apiClient.get("/account/me");
    }

    updateProfile(profile) {
        return apiClient.put("/account/me", profile);
    }

    login(loginDto) {
        return apiClient.post("/auth/login", loginDto);
    }
}
