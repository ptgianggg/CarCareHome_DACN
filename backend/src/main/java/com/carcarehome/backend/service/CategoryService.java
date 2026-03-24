package com.carcarehome.backend.service;

import com.carcarehome.backend.entity.Category;
import com.carcarehome.backend.entity.BookingItem;
import com.carcarehome.backend.repository.CategoryRepository;
import com.carcarehome.backend.repository.BookingItemRepository;
import com.carcarehome.backend.repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BookingItemRepository bookingItemRepository;

    @Autowired
    private ServiceRepository serviceRepository;

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

    public List<Category> getFeaturedCategories() {
        List<BookingItem> items = bookingItemRepository.findAll();
        List<com.carcarehome.backend.entity.Service> services = serviceRepository.findAll();
        
        // Map service name to category name
        Map<String, String> serviceToCategory = services.stream()
            .collect(Collectors.toMap(com.carcarehome.backend.entity.Service::getName, com.carcarehome.backend.entity.Service::getCategory, (a, b) -> a));

        // Count occurrences of categories in booking items
        Map<String, Long> categoryCounts = items.stream()
            .map(item -> serviceToCategory.get(item.getServiceType()))
            .filter(Objects::nonNull)
            .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

        // Sort by count descending and take top 3
        List<String> topCategoryNames = categoryCounts.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(3)
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());

        List<Category> allCategories = categoryRepository.findAll();
        
        // Fallback: if no bookings yet, just take first 3 categories
        if (topCategoryNames.isEmpty()) {
            return allCategories.stream().limit(3).collect(Collectors.toList());
        }

        return allCategories.stream()
            .filter(cat -> topCategoryNames.contains(cat.getName()))
            .sorted(Comparator.comparingInt(cat -> topCategoryNames.indexOf(cat.getName())))
            .collect(Collectors.toList());
    }
}
