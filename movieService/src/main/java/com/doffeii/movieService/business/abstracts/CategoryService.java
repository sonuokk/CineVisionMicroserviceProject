package com.doffeii.movieService.business.abstracts;

import com.doffeii.movieService.entity.Category;
import com.doffeii.movieService.entity.dto.CategoryRequestDto;

import java.util.List;

public interface CategoryService {

    List<Category> getall();

    Category getCategoryById(int categoryId);

    Category add(CategoryRequestDto categoryRequestDto);
}
