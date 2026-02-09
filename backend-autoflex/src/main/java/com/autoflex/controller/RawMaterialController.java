package com.autoflex.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.autoflex.model.RawMaterial;
import com.autoflex.repository.RawMaterialRepository;

@RestController
@RequestMapping("/raw-materials")
@CrossOrigin(origins = "http://localhost:3000") 
public class RawMaterialController {

    @Autowired
    private RawMaterialRepository repository;

    // GET /raw-materials
    @GetMapping
    public List<RawMaterial> getAll() {
        return repository.findAll();
    }

    // GET /raw-materials/{id}
    @GetMapping("/{id}")
    public ResponseEntity<RawMaterial> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /raw-materials
    @PostMapping
    public RawMaterial create(@RequestBody RawMaterial material) {
        return repository.save(material);
    }

    // PUT /raw-materials/{id}
    @PutMapping("/{id}")
    public ResponseEntity<RawMaterial> update(@PathVariable Long id, @RequestBody RawMaterial material) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setCode(material.getCode());
                    existing.setName(material.getName());
                    existing.setUnit(material.getUnit());        
                    existing.setQuantity(material.getQuantity()); 
                    existing.setUnitPrice(material.getUnitPrice()); 
                    repository.save(existing);
                    return ResponseEntity.ok(existing);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE /raw-materials/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // PATCH /raw-materials/{id}/stock?quantity=10
    @PatchMapping("/{id}/stock")
    public ResponseEntity<RawMaterial> adjustStock(@PathVariable Long id, @RequestParam Integer quantity) {
        return repository.findById(id)
                .map(material -> {
                    material.setQuantity(material.getQuantity() + quantity); 
                    repository.save(material);
                    return ResponseEntity.ok(material);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}