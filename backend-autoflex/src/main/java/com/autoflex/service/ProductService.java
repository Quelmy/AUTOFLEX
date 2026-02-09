package com.autoflex.service;  // ← ADICIONE ESTA LINHA

import com.autoflex.model.Product;
import com.autoflex.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getAll() {
        return productRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Product> getById(Long id) {
        return productRepository.findById(id);
    }

    @Transactional
    public Product create(Product product) {
        // Validação opcional: verificar se código já existe
        if (product.getCode() != null && 
            productRepository.findByCode(product.getCode()).isPresent()) {
            throw new RuntimeException("Já existe um produto com o código: " + product.getCode());
        }
        return productRepository.save(product);
    }

    @Transactional
    public Product update(Long id, Product updated) {
        return productRepository.findById(id)
                .map(prod -> {
                    // Atualiza apenas os campos permitidos
                    prod.setCode(updated.getCode());
                    prod.setName(updated.getName());
                    prod.setValue(updated.getValue());
                    return productRepository.save(prod);
                })
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + id));
    }

    @Transactional
    public void delete(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Produto não encontrado com ID: " + id);
        }
        productRepository.deleteById(id);
    }

    // Método adicional: buscar por código
    @Transactional(readOnly = true)
    public Optional<Product> findByCode(String code) {
        return productRepository.findByCode(code);
    }
}