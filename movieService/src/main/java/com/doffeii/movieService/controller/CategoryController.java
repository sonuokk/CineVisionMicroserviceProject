package com.doffeii.movieService.controller;

import com.doffeii.movieService.business.abstracts.CategoryService;
import com.doffeii.movieService.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movie/categories/")
@RequiredArgsConstructor
//@CrossOrigin
public class CategoryController {

    private final CategoryService categoryService;


    @GetMapping("getall")
    public List<Category> getall() {
       return categoryService.getall();
    }
}
