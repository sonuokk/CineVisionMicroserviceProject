package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.PaymentCardDetail;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;

public interface PaymentCardDetailDao extends MongoRepository<PaymentCardDetail, String> {
    PaymentCardDetail findByBookingBookingCode(String bookingCode);
    void deleteByBookingBookingCodeIn(Collection<String> bookingCodes);
}
