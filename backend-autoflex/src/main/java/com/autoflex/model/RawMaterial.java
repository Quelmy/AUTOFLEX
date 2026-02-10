package com.autoflex.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore; 

@Entity
@Table(name = "raw_materials")
public class RawMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String code;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String unit;
    
    @Column(nullable = false)
    private Integer quantity;
    
    @Column(nullable = false)
    private BigDecimal unitPrice;
    
    @OneToMany(mappedBy = "rawMaterial")
    @JsonIgnore
    private List<ProductMaterial> productMaterials;
    
    public RawMaterial() {}
    
    // Construtor simplificado para testes
    public RawMaterial(String code, String name, String unit, Integer quantity, BigDecimal unitPrice) {
        this.code = code;
        this.name = name;
        this.unit = unit;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }
    
    // Construtor ainda mais simplificado (sem unitPrice)
    public RawMaterial(String code, String name, Integer quantity) {
        this.code = code;
        this.name = name;
        this.unit = "un";
        this.quantity = quantity;
        this.unitPrice = BigDecimal.ZERO;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    
    @JsonIgnore 
    public List<ProductMaterial> getProductMaterials() { 
        return productMaterials; 
    }
    
    public void setProductMaterials(List<ProductMaterial> productMaterials) { 
        this.productMaterials = productMaterials; 
    }
}
