import { apiClient } from "./apiClient";

export class UserService {

    addCustomer(customer) {
        return apiClient.post("/auth/signup/request-otp", customer);
    }

    verifyCustomerOtp(payload) {
        return apiClient.post("/auth/signup/verify-otp", payload);
    }

    addAdmin(admin) {
        return apiClient.post("/admin/setup", admin);
    }

    getAllUsers() {
        return apiClient.get("/user/users/admin/all");
    }

    promoteUserToAdmin(email) {
        return apiClient.post("/user/users/admin/promote", { email });
    }

    login(loginDto) {
        return apiClient.post("/auth/login", loginDto);
    }
}
