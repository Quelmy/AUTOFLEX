package com.autoflex.model;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "product_materials")
public class ProductMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore  
    private Product product;
    
    @ManyToOne
    @JoinColumn(name = "raw_material_id", nullable = false)
    @JsonIgnore  
    private RawMaterial rawMaterial;
    
    @Column(nullable = false)
    private Integer requiredQuantity;
    
    // Construtores
    public ProductMaterial() {}
    
    public ProductMaterial(Product product, RawMaterial rawMaterial, Integer requiredQuantity) {
        this.product = product;
        this.rawMaterial = rawMaterial;
        this.requiredQuantity = requiredQuantity;
    }
    
    // Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    
    public RawMaterial getRawMaterial() { return rawMaterial; }
    public void setRawMaterial(RawMaterial rawMaterial) { this.rawMaterial = rawMaterial; }
    
    public Integer getRequiredQuantity() { return requiredQuantity; }
    public void setRequiredQuantity(Integer requiredQuantity) { 
        this.requiredQuantity = requiredQuantity; 
    }
}
