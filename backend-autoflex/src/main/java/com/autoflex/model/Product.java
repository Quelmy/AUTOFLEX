package com.autoflex.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, unique = true, nullable = false)
    private String code;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @OneToMany(mappedBy = "product")
    @JsonIgnore
    private List<ProductMaterial> productMaterials;

    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public BigDecimal getValue() { return value; }
    public void setValue(BigDecimal value) { this.value = value; }
    
    @JsonIgnore
    public List<ProductMaterial> getProductMaterials() { 
        return productMaterials; 
    }
    
    public void setProductMaterials(List<ProductMaterial> productMaterials) { 
        this.productMaterials = productMaterials; 
    }
}