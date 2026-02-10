package com.autoflex.repository;

import com.autoflex.model.Product;
import com.autoflex.model.RawMaterial;
import com.autoflex.model.ProductMaterial;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface ProductMaterialRepository extends ListCrudRepository<ProductMaterial, Long> {
    
    Optional<ProductMaterial> findByProductIdAndRawMaterialId(Long productId, Long rawMaterialId);
    
    List<ProductMaterial> findByProductId(Long productId);
    
    List<ProductMaterial> findByRawMaterialId(Long rawMaterialId);
    
   
    Optional<ProductMaterial> findByProductAndRawMaterial(Product product, RawMaterial rawMaterial);
    
}
