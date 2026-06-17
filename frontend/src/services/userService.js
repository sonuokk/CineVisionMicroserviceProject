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

    getBookedTicketUsers() {
        return apiClient.get("/user/users/admin/bookings");
    }

    promoteUserToAdmin(email) {
        return apiClient.post("/admin/users/promote", { email });
    }

    promoteUserToTheaterManager(email, theaterName) {
        return apiClient.post("/admin/users/promote-theater-manager", { email, theaterName });
    }

    updateUserRole(email, role, theaterName) {
        return apiClient.post("/admin/users/role", { email, role, theaterName });
    }

    approveTheaterManagerRequest(email, theaterName) {
        return apiClient.post("/admin/users/theater-manager/approve", { email, theaterName });
    }

    rejectTheaterManagerRequest(email, reason) {
        return apiClient.post("/admin/users/theater-manager/reject", { email, reason });
    }

    blacklistUser(email, duration, reason) {
        return apiClient.post("/admin/users/blacklist", { email, duration, reason });
    }

    removeUserBlacklist(email) {
        return apiClient.delete("/admin/users/blacklist", { params: { email } });
    }

    sendAdminNotification(payload) {
        return apiClient.post("/admin/users/notifications", payload);
    }

    deleteUser(email) {
        return apiClient.delete("/admin/users/delete", { params: { email } });
    }

    getProfile() {
        return apiClient.get("/account/me");
    }

    updateProfile(profile) {
        return apiClient.put("/account/me", profile);
    }

    updateNotificationPreferences(preferences) {
        return apiClient.put("/account/notifications", preferences);
    }

    addFavoriteMovie(movie) {
        return apiClient.post("/account/favorites/movies", movie);
    }

    removeFavoriteMovie(movieId) {
        return apiClient.delete("/account/favorites/movies/" + movieId);
    }

    addFavoriteTheater(theater) {
        return apiClient.post("/account/favorites/theaters", theater);
    }

    removeFavoriteTheater(theaterName) {
        return apiClient.delete("/account/favorites/theaters/" + encodeURIComponent(theaterName));
    }

    requestAccountDeleteOtp() {
        return apiClient.post("/account/delete/request-otp");
    }

    confirmAccountDeleteOtp(otp) {
        return apiClient.post("/account/delete/confirm", { otp });
    }

    login(loginDto) {
        return apiClient.post("/auth/login", loginDto);
    }

    googleLogin(credentialOrPayload) {
        const payload = typeof credentialOrPayload === "string"
            ? { credential: credentialOrPayload }
            : credentialOrPayload;
        return apiClient.post("/auth/google", payload);
    }
}
