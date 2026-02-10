package com.autoflex.service;  

import com.autoflex.model.Product;
import com.autoflex.model.RawMaterial;
import com.autoflex.model.ProductMaterial;
import com.autoflex.repository.ProductMaterialRepository;
import com.autoflex.repository.ProductRepository;
import com.autoflex.repository.RawMaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional
public class ProductMaterialService {

    private final ProductMaterialRepository productMaterialRepository;
    private final ProductRepository productRepository;
    private final RawMaterialRepository rawMaterialRepository;

    public ProductMaterialService(ProductMaterialRepository productMaterialRepository,
                                  ProductRepository productRepository,
                                  RawMaterialRepository rawMaterialRepository) {
        this.productMaterialRepository = productMaterialRepository;
        this.productRepository = productRepository;
        this.rawMaterialRepository = rawMaterialRepository;
    }

    @Transactional
    public ProductMaterial addOrUpdateMaterial(Long productId, Long rawMaterialId, Integer requiredQuantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Produto não encontrado com ID: " + productId));
        
        RawMaterial material = rawMaterialRepository.findById(rawMaterialId)
                .orElseThrow(() -> new RuntimeException("Matéria-prima não encontrada com ID: " + rawMaterialId));

        // Busca ou cria nova associação
        ProductMaterial association = productMaterialRepository
                .findByProductIdAndRawMaterialId(productId, rawMaterialId)
                .orElse(new ProductMaterial(product, material, requiredQuantity));

        association.setRequiredQuantity(requiredQuantity);
        return productMaterialRepository.save(association);
    }

    @Transactional
    public void removeMaterial(Long productId, Long rawMaterialId) {
        ProductMaterial association = productMaterialRepository
                .findByProductIdAndRawMaterialId(productId, rawMaterialId)
                .orElseThrow(() -> new RuntimeException(
                    "Associação não encontrada para produto ID: " + productId + 
                    " e matéria-prima ID: " + rawMaterialId));

        productMaterialRepository.delete(association);
    }

    @Transactional(readOnly = true)
    public List<ProductMaterial> getMaterialsByProduct(Long productId) {
        // Verifica se o produto existe
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Produto não encontrado com ID: " + productId);
        }
        
        return productMaterialRepository.findByProductId(productId);
    }
}
