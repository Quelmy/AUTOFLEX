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
import java.util.Optional;

@RestController
@RequestMapping("/products/{productId}/materials")  
@CrossOrigin(origins = "http://localhost:3000") 
public class ProductMaterialController {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private ProductMaterialRepository productMaterialRepository;

    // Adicionar ou atualizar associação
    @PostMapping
    public ResponseEntity<?> addOrUpdateMaterial(
            @PathVariable Long productId,
            @RequestParam Long rawMaterialId,
            @RequestParam Integer requiredQuantity
    ) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Produto não encontrado");
        }

        Optional<RawMaterial> materialOpt = rawMaterialRepository.findById(rawMaterialId);
        if (materialOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Matéria-prima não encontrada");
        }

        ProductMaterial association = productMaterialRepository
                .findByProductIdAndRawMaterialId(productId, rawMaterialId)
                .orElse(new ProductMaterial(productOpt.get(), materialOpt.get(), requiredQuantity));

        association.setRequiredQuantity(requiredQuantity);
        productMaterialRepository.save(association);

        return ResponseEntity.status(201).body(association);
    }

    // Remover associação
    @DeleteMapping("/{rawMaterialId}")
    public ResponseEntity<?> removeMaterial(
            @PathVariable Long productId,
            @PathVariable Long rawMaterialId
    ) {
        Optional<ProductMaterial> associationOpt = productMaterialRepository
                .findByProductIdAndRawMaterialId(productId, rawMaterialId);

        if (associationOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Associação não encontrada");
        }

        productMaterialRepository.delete(associationOpt.get());
        return ResponseEntity.ok("Associação removida com sucesso");
    }

    // Listar associações de um produto
    @GetMapping
    public ResponseEntity<?> listMaterials(@PathVariable Long productId) {
        Optional<Product> productOpt = productRepository.findById(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Produto não encontrado");
        }

        return ResponseEntity.ok(productMaterialRepository.findByProductId(productId));
    }
}
