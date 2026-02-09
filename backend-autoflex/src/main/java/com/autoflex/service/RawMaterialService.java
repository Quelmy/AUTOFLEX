package com.autoflex.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.autoflex.model.RawMaterial;
import com.autoflex.repository.RawMaterialRepository;

@Service
@Transactional
public class RawMaterialService {

    private final RawMaterialRepository rawMaterialRepository;

    public RawMaterialService(RawMaterialRepository rawMaterialRepository) {
        this.rawMaterialRepository = rawMaterialRepository;
    }

    @Transactional(readOnly = true)
    public List<RawMaterial> getAll() {
        return rawMaterialRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<RawMaterial> getById(Long id) {
        return rawMaterialRepository.findById(id);
    }

    @Transactional
    public RawMaterial create(RawMaterial rawMaterial) {
        // Validação: verificar se código já existe
        if (rawMaterial.getCode() != null && 
            rawMaterialRepository.findByCode(rawMaterial.getCode()).isPresent()) {
            throw new RuntimeException("Já existe uma matéria-prima com o código: " + rawMaterial.getCode());
        }
        return rawMaterialRepository.save(rawMaterial);
    }

    @Transactional
    public RawMaterial update(Long id, RawMaterial updated) {
        return rawMaterialRepository.findById(id)
                .map(material -> {
                    material.setCode(updated.getCode());
                    material.setName(updated.getName());
                    material.setUnit(updated.getUnit());
                    material.setQuantity(updated.getQuantity());  // ← ALTERADO: de stockQuantity para quantity
                    material.setUnitPrice(updated.getUnitPrice());
                    return rawMaterialRepository.save(material);
                })
                .orElseThrow(() -> new RuntimeException("Matéria-prima não encontrada com ID: " + id));
    }

    @Transactional
    public void delete(Long id) {
        if (!rawMaterialRepository.existsById(id)) {
            throw new RuntimeException("Matéria-prima não encontrada com ID: " + id);
        }
        rawMaterialRepository.deleteById(id);
    }

    @Transactional
    public RawMaterial updateStock(Long id, Integer quantity) {
        RawMaterial material = rawMaterialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matéria-prima não encontrada com ID: " + id));
        
        int newStock = material.getQuantity() + quantity;  // ← ALTERADO: getQuantity() em vez de getStockQuantity()
        // Validação opcional: não permitir estoque negativo
        if (newStock < 0) {
            throw new RuntimeException("Estoque não pode ficar negativo. Estoque atual: " + 
                                     material.getQuantity() + ", tentativa de remover: " + Math.abs(quantity));
        }
        
        material.setQuantity(newStock);  // ← ALTERADO: setQuantity() em vez de setStockQuantity()
        return rawMaterialRepository.save(material);
    }

    // Método adicional: buscar por código
    @Transactional(readOnly = true)
    public Optional<RawMaterial> findByCode(String code) {
        return rawMaterialRepository.findByCode(code);
    }

    // Método adicional: verificar disponibilidade de estoque
    @Transactional(readOnly = true)
    public boolean checkStockAvailability(Long rawMaterialId, Integer requiredQuantity) {
        return rawMaterialRepository.findById(rawMaterialId)
                .map(material -> material.getQuantity() >= requiredQuantity)  // ← ALTERADO: getQuantity()
                .orElse(false);
    }
}