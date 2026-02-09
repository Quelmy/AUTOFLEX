package com.autoflex.repository;

import com.autoflex.model.RawMaterial;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RawMaterialRepository extends ListCrudRepository<RawMaterial, Long> {
    
    Optional<RawMaterial> findByCode(String code); // Buscar matéria-prima pelo código
    
}