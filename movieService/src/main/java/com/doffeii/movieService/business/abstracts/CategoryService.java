package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.Category;

import java.util.List;

public interface CategoryService {

    List<Category> getall();

    Category getCategoryById(int categoryId);
}
