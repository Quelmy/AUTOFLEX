package com.autoflex.controller;

import com.autoflex.model.Product;
import com.autoflex.model.RawMaterial;
import com.autoflex.model.ProductMaterial;
import com.autoflex.repository.ProductRepository;
import com.autoflex.repository.RawMaterialRepository;
import com.autoflex.repository.ProductMaterialRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/production")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductionController {

    @Autowired
    private ProductRepository productRepo;

    @Autowired
    private RawMaterialRepository rawMaterialRepo;

    @Autowired
    private ProductMaterialRepository productMaterialRepo;

    @GetMapping("/suggestions")
    public List<Map<String, Object>> getProductionSuggestions() {
        List<Product> products = productRepo.findAll();
        List<RawMaterial> rawMaterials = rawMaterialRepo.findAll();
        List<ProductMaterial> productMaterials = productMaterialRepo.findAll();
        
        Map<Long, Integer> stockMap = rawMaterials.stream()
                .collect(Collectors.toMap(
                        RawMaterial::getId,
                        RawMaterial::getQuantity
                ));
        
        List<Map<String, Object>> suggestions = new ArrayList<>();
        
        for (Product product : products) {
            List<ProductMaterial> materials = productMaterials.stream()
                    .filter(pm -> pm.getProduct().getId().equals(product.getId()))
                    .collect(Collectors.toList());
            
            if (materials.isEmpty()) continue;
            
            // Calcular quantas unidades podem ser produzidas
            int maxQuantity = Integer.MAX_VALUE;
            boolean canProduce = true;
            
            for (ProductMaterial pm : materials) {
                Long materialId = pm.getRawMaterial().getId();
                Integer required = pm.getRequiredQuantity();
                Integer available = stockMap.get(materialId);
                
                if (available == null || available < required) {
                    canProduce = false;
                    break;
                }
                
                int possible = available / required;
                if (possible < maxQuantity) {
                    maxQuantity = possible;
                }
            }
            
            if (canProduce && maxQuantity > 0 && maxQuantity < Integer.MAX_VALUE) {
                Map<String, Object> suggestion = new HashMap<>();
                
                // Converter produto para Map para evitar problemas de serialização
                Map<String, Object> productMap = new HashMap<>();
                productMap.put("id", product.getId());
                productMap.put("code", product.getCode());
                productMap.put("name", product.getName());
                productMap.put("value", product.getValue());
                
                suggestion.put("product", productMap);
                suggestion.put("maxQuantity", maxQuantity);
                
                
                BigDecimal totalValue = product.getValue().multiply(BigDecimal.valueOf(maxQuantity));
                suggestion.put("totalValue", totalValue);
                
                // Adicionar detalhes das matérias-primas
                List<Map<String, Object>> materialDetails = materials.stream()
                        .map(pm -> {
                            Map<String, Object> detail = new HashMap<>();
                            detail.put("rawMaterialId", pm.getRawMaterial().getId());
                            detail.put("rawMaterialName", pm.getRawMaterial().getName());
                            detail.put("requiredQuantity", pm.getRequiredQuantity());
                            detail.put("available", stockMap.get(pm.getRawMaterial().getId()));
                            return detail;
                        })
                        .collect(Collectors.toList());
                
                suggestion.put("materialDetails", materialDetails);
                suggestions.add(suggestion);
            }
        }
        
        // CORREÇÃO: Ordenar por maior valor total (BigDecimal)
        suggestions.sort((a, b) -> {
            BigDecimal valueA = (BigDecimal) a.get("totalValue");
            BigDecimal valueB = (BigDecimal) b.get("totalValue");
            return valueB.compareTo(valueA); // Ordem decrescente
        });
        
        return suggestions;
    }
    
    // Opcional: Endpoint para simular produção
    @PostMapping("/simulate")
    public Map<String, Object> simulateProduction(@RequestBody Map<String, Object> request) {
        Long productId = Long.valueOf(request.get("productId").toString());
        Integer quantity = Integer.valueOf(request.get("quantity").toString());
        
        Optional<Product> productOpt = productRepo.findById(productId);
        List<ProductMaterial> materials = productMaterialRepo.findByProductId(productId);
        List<RawMaterial> allMaterials = rawMaterialRepo.findAll();
        
        Map<Long, Integer> stockMap = allMaterials.stream()
                .collect(Collectors.toMap(
                        RawMaterial::getId,
                        RawMaterial::getQuantity
                ));
        
        Map<String, Object> response = new HashMap<>();
        
        if (productOpt.isEmpty() || materials.isEmpty()) {
            response.put("success", false);
            response.put("message", "Produto não encontrado ou sem matérias-primas definidas");
            return response;
        }
        
        Product product = productOpt.get();
        boolean canProduce = true;
        List<Map<String, Object>> requiredMaterials = new ArrayList<>();
        
        // Verificar se há estoque suficiente
        for (ProductMaterial pm : materials) {
            Long materialId = pm.getRawMaterial().getId();
            Integer required = pm.getRequiredQuantity() * quantity;
            Integer available = stockMap.get(materialId);
            
            Map<String, Object> materialInfo = new HashMap<>();
            materialInfo.put("materialId", materialId);
            materialInfo.put("materialName", pm.getRawMaterial().getName());
            materialInfo.put("requiredPerUnit", pm.getRequiredQuantity());
            materialInfo.put("requiredTotal", required);
            materialInfo.put("available", available);
            materialInfo.put("sufficient", available != null && available >= required);
            
            requiredMaterials.add(materialInfo);
            
            if (available == null || available < required) {
                canProduce = false;
            }
        }
        
        response.put("productId", productId);
        response.put("productName", product.getName());
        response.put("quantity", quantity);
        response.put("unitValue", product.getValue());
        response.put("totalValue", product.getValue().multiply(BigDecimal.valueOf(quantity)));
        response.put("canProduce", canProduce);
        response.put("materials", requiredMaterials);
        
        return response;
    }
}
