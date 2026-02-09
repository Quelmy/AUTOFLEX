package com.autoflex.repository;

import com.autoflex.model.Product;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductRepository extends ListCrudRepository<Product, Long> {
    
    Optional<Product> findByCode(String code); // Buscar produto pelo código
    
}