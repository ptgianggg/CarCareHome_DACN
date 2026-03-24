package com.carcarehome.backend.service;

import com.carcarehome.backend.entity.Category;
import com.carcarehome.backend.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(Long id) {
        return categoryRepository.findById(id);
    }

    public Category saveCategory(Category category) {
        // Kiểm tra tên trùng lặp (Case insensitive)
        Optional<Category> existing = categoryRepository.findByName(category.getName());
        if (existing.isPresent() && (category.getId() == null || !existing.get().getId().equals(category.getId()))) {
            throw new RuntimeException("Tên danh mục '" + category.getName() + "' đã tồn tại.");
        }
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Danh mục không tồn tại với id: " + id);
        }
        categoryRepository.deleteById(id);
    }
}
