package com.doffeii.movieService.dao;

import com.doffeii.movieService.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryDao extends MongoRepository<Category, Integer> {
    Category getCategoryByCategoryId(int categoryId);
    Optional<Category> findFirstByCategoryNameIgnoreCase(String categoryName);
}
