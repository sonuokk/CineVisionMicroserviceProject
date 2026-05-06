import { apiClient } from "./apiClient";

export class PaymentService {

    sendTicketDetail(ticketDetail) {
        return apiClient.post("/movie/payments/sendTicketDetail", ticketDetail);
    }

    getBookedSeats(params) {
        return apiClient.get("/tickets/booked-seats", { params });
    }
}
