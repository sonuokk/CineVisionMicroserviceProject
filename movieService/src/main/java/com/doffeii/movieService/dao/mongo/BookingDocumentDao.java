package com.doffeii.movieService.dao.mongo;

import com.doffeii.movieService.entity.mongo.BookingDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface BookingDocumentDao extends MongoRepository<BookingDocument, String> {
    BookingDocument findByBookingCode(String bookingCode);
}
