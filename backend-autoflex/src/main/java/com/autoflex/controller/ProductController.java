package com.autoflex.controller;

import com.autoflex.model.Product;
import com.autoflex.model.RawMaterial;
import com.autoflex.model.ProductMaterial;
import com.autoflex.repository.ProductRepository;
import com.autoflex.repository.RawMaterialRepository;
import com.autoflex.repository.ProductMaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private RawMaterialRepository rawMaterialRepo;

    @Autowired
    private ProductMaterialRepository productMaterialRepo;

    // GET /products - Retorna Map para evitar recursividade
    @GetMapping
    public List<Map<String, Object>> getAll() {
        return productRepo.findAll().stream()
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    map.put("code", p.getCode());
                    map.put("name", p.getName());
                    map.put("value", p.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }

    // GET /products/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        return productRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /products
    @PostMapping
    public Product create(@RequestBody Product product) {
        return productRepo.save(product);
    }

    // PUT /products/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable Long id, @RequestBody Product product) {
        return productRepo.findById(id)
                .map(existing -> {
                    existing.setCode(product.getCode());
                    existing.setName(product.getName());
                    existing.setValue(product.getValue());
                    productRepo.save(existing);
                    return ResponseEntity.ok(existing);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /products/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!productRepo.existsById(id)) return ResponseEntity.notFound().build();
        productRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // POST /products/{id}/materials
    @PostMapping("/{id}/materials")
    public ResponseEntity<ProductMaterial> addMaterial(
            @PathVariable Long id,
            @RequestParam Long rawMaterialId,
            @RequestParam Integer requiredQuantity) {

        Optional<Product> productOpt = productRepo.findById(id);
        Optional<RawMaterial> materialOpt = rawMaterialRepo.findById(rawMaterialId);

        if (productOpt.isEmpty() || materialOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        RawMaterial material = materialOpt.get();

        ProductMaterial association = productMaterialRepo
                .findByProductIdAndRawMaterialId(id, rawMaterialId)
                .orElse(new ProductMaterial(product, material, requiredQuantity));

        association.setRequiredQuantity(requiredQuantity);
        productMaterialRepo.save(association);

        return ResponseEntity.ok(association);
    }

    // DELETE /products/{id}/materials/{materialId}
    @DeleteMapping("/{id}/materials/{materialId}")
    public ResponseEntity<Void> removeMaterial(
            @PathVariable Long id,
            @PathVariable Long materialId) {

        Optional<Product> productOpt = productRepo.findById(id);
        Optional<RawMaterial> materialOpt = rawMaterialRepo.findById(materialId);

        if (productOpt.isEmpty() || materialOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        productMaterialRepo.findByProductIdAndRawMaterialId(id, materialId)
                .ifPresent(productMaterialRepo::delete);

        return ResponseEntity.noContent().build();
    }

    // GET /products/{id}/materials
@GetMapping("/{id}/materials")
public ResponseEntity<List<ProductMaterial>> getMaterials(@PathVariable Long id) {
    if (!productRepo.existsById(id)) {
        return ResponseEntity.notFound().build();
    }
    
    List<ProductMaterial> materials = productMaterialRepo.findByProductId(id);
    return ResponseEntity.ok(materials);
}
}