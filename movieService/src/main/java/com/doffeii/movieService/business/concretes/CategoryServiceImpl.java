package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CategoryService;
import com.doffeii.movieService.dao.CategoryDao;
import com.doffeii.movieService.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryDao categoryDao;

    @Cacheable(value = "categories")
    @Override
    public List<Category> getall() {

        return categoryDao.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
    }

    @Override
    public Category getCategoryById(int categoryId) {
        return categoryDao.getCategoryByCategoryId(categoryId);
    }
}
