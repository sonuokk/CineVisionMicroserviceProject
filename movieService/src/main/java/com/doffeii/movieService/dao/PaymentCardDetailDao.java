package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.PaymentCardDetail;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PaymentCardDetailDao extends MongoRepository<PaymentCardDetail, String> {
    PaymentCardDetail findByBookingBookingCode(String bookingCode);
}
