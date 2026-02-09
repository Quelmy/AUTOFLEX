// @/utils/typeHelpers.ts

import { Product, RawMaterial, ProductRawMaterial, StockStatus, ValidationResult } from ".";

/**
 * Extrai a composição de um produto, lidando com ambos os formatos
 * (composition do frontend e productMaterials do backend)
 */
export function getProductComposition(product: Product): ProductRawMaterial[] {
  if (product.composition && product.composition.length > 0) {
    return product.composition;
  }
  
  if (product.productMaterials && product.productMaterials.length > 0) {
    return product.productMaterials.map(pm => ({
      rawMaterialId: String(pm.rawMaterial.id), // Converte number para string
      rawMaterial: {
        id: String(pm.rawMaterial.id),
        code: pm.rawMaterial.code,
        name: pm.rawMaterial.name,
        stockQuantity: pm.rawMaterial.stockQuantity,
      },
      quantityRequired: pm.requiredQuantity,
    }));
  }
  
  return [];
}

/**
 * Determina o status do estoque baseado na quantidade
 */
export function getStockStatus(stockQuantity: number): StockStatus {
  if (stockQuantity <= 5) return StockStatus.CRITICAL;
  if (stockQuantity <= 10) return StockStatus.LOW;
  if (stockQuantity > 100) return StockStatus.OVERSTOCK;
  return StockStatus.NORMAL;
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Valida se um produto pode ser produzido com o estoque atual
 */
export function canProduceProduct(
  product: Product, 
  rawMaterials: RawMaterial[]
): { canProduce: boolean; maxQuantity: number; limitingMaterial?: RawMaterial } {
  let maxQuantity = Infinity;
  let limitingMaterial: RawMaterial | undefined;
  
  const composition = getProductComposition(product);
  
  for (const comp of composition) {
    const material = rawMaterials.find(rm => rm.id === comp.rawMaterialId);
    if (!material) {
      return { canProduce: false, maxQuantity: 0 };
    }
    
    const possibleQuantity = Math.floor(material.stockQuantity / comp.quantityRequired);
    if (possibleQuantity < maxQuantity) {
      maxQuantity = possibleQuantity;
      limitingMaterial = material;
    }
  }
  
  return {
    canProduce: maxQuantity > 0,
    maxQuantity: maxQuantity === Infinity ? 0 : maxQuantity,
    limitingMaterial
  };
}

/**
 * Calcula o valor total de produção
 */
export function calculateProductionValue(
  product: Product, 
  quantity: number
): number {
  return product.value * quantity;
}

/**
 * Converte um ID de string para number (para o backend)
 */
export function toBackendId(id: string): number {
  return parseInt(id, 10);
}

/**
 * Converte um ID de number para string (para o frontend)
 */
export function toFrontendId(id: number): string {
  return String(id);
}

/**
 * Cria uma cópia segura de um objeto para evitar mutações
 */
export function safeClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Valida dados de produto
 */
export function validateProduct(product: Partial<Product>): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  if (!product.code?.trim()) {
    errors.code = ['Código é obrigatório'];
  }
  
  if (!product.name?.trim()) {
    errors.name = ['Nome é obrigatório'];
  }
  
  if (product.value === undefined || product.value <= 0) {
    errors.value = ['Valor deve ser maior que zero'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Valida dados de matéria-prima
 */
export function validateRawMaterial(material: Partial<RawMaterial>): ValidationResult {
  const errors: Record<string, string[]> = {};
  
  if (!material.code?.trim()) {
    errors.code = ['Código é obrigatório'];
  }
  
  if (!material.name?.trim()) {
    errors.name = ['Nome é obrigatório'];
  }
  
  if (material.stockQuantity === undefined || material.stockQuantity < 0) {
    errors.stockQuantity = ['Quantidade não pode ser negativa'];
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}