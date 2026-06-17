package com.doffeii.movieService.business.concretes;

import com.doffeii.movieService.business.abstracts.CategoryService;
import com.doffeii.movieService.dao.CategoryDao;
import com.doffeii.movieService.entity.Category;
import com.doffeii.movieService.entity.dto.CategoryRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryDao categoryDao;
    private final WebClient.Builder webClientBuilder;

    @Cacheable(value = "categories")
    @Override
    public List<Category> getall() {

        return categoryDao.findAll(Sort.by(Sort.Direction.ASC, "categoryName"));
    }

    @Override
    public Category getCategoryById(int categoryId) {
        return categoryDao.getCategoryByCategoryId(categoryId);
    }

    @CacheEvict(value = "categories", allEntries = true)
    @Override
    public Category add(CategoryRequestDto categoryRequestDto) {
        Boolean result = webClientBuilder.build().get()
                .uri("http://USERSERVICE/api/user/users/isUserAdmin")
                .header("Authorization", "Bearer " + categoryRequestDto.getToken())
                .retrieve()
                .bodyToMono(Boolean.class)
                .block();

        if (!Boolean.TRUE.equals(result)) {
            throw new RuntimeException("Only admins can manage genres");
        }

        String categoryName = categoryRequestDto.getCategoryName() == null
                ? ""
                : categoryRequestDto.getCategoryName().trim();
        if (categoryName.isBlank()) {
            throw new IllegalArgumentException("Genre name is required");
        }

        return categoryDao.findFirstByCategoryNameIgnoreCase(categoryName)
                .orElseGet(() -> categoryDao.save(new Category(nextCategoryId(), categoryName, null)));
    }

    private int nextCategoryId() {
        return categoryDao.findAll().stream()
                .map(Category::getCategoryId)
                .filter(id -> id != null)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0) + 1;
    }
}
