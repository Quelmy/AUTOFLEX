// lib/mockData.ts
import { ProductionSuggestion, Product, RawMaterial } from "@/types";

// Mock de produtos
export const mockProducts: Product[] = [
  {
    id: "1",
    code: "PROD001",
    name: "Produto A",
    value: 100.0,
    composition: [
      {
        rawMaterialId: "1",
        rawMaterial: {
          id: "1",
          code: "MAT001",
          name: "Matéria Prima X",
          stockQuantity: 50,
        },
        quantityRequired: 2,
      },
      {
        rawMaterialId: "2",
        rawMaterial: {
          id: "2",
          code: "MAT002",
          name: "Matéria Prima Y",
          stockQuantity: 30,
        },
        quantityRequired: 1,
      },
    ],
  },
  {
    id: "2",
    code: "PROD002",
    name: "Produto B",
    value: 150.0,
    composition: [
      {
        rawMaterialId: "1",
        rawMaterial: {
          id: "1",
          code: "MAT001",
          name: "Matéria Prima X",
          stockQuantity: 50,
        },
        quantityRequired: 1,
      },
      {
        rawMaterialId: "3",
        rawMaterial: {
          id: "3",
          code: "MAT003",
          name: "Matéria Prima Z",
          stockQuantity: 20,
        },
        quantityRequired: 3,
      },
    ],
  },
  {
    id: "3",
    code: "PROD003",
    name: "Produto C",
    value: 75.0,
    composition: [
      {
        rawMaterialId: "2",
        rawMaterial: {
          id: "2",
          code: "MAT002",
          name: "Matéria Prima Y",
          stockQuantity: 30,
        },
        quantityRequired: 2,
      },
      {
        rawMaterialId: "3",
        rawMaterial: {
          id: "3",
          code: "MAT003",
          name: "Matéria Prima Z",
          stockQuantity: 20,
        },
        quantityRequired: 1,
      },
    ],
  },
];

// Mock de matérias-primas
export const mockRawMaterials: RawMaterial[] = [
  {
    id: "1",
    code: "MAT001",
    name: "Matéria Prima X",
    stockQuantity: 50,
  },
  {
    id: "2",
    code: "MAT002",
    name: "Matéria Prima Y",
    stockQuantity: 30,
  },
  {
    id: "3",
    code: "MAT003",
    name: "Matéria Prima Z",
    stockQuantity: 20,
  },
];

// Função para gerar sugestões de produção mock - VERSÃO CORRIGIDA
export const getMockSuggestions = (): ProductionSuggestion[] => {
  const suggestions: ProductionSuggestion[] = [];

  mockProducts.forEach((product) => {
    if (!product.composition || product.composition.length === 0) {
      return;
    }

    // Encontrar o fator limitante
    let maxQuantity = Infinity;

    product.composition.forEach((comp) => {
      const material = mockRawMaterials.find(
        (rm) => rm.id === comp.rawMaterialId,
      );
      if (material) {
        const possibleUnits = Math.floor(
          material.stockQuantity / comp.quantityRequired,
        );
        maxQuantity = Math.min(maxQuantity, possibleUnits);
      }
    });

    // Se for possível produzir pelo menos 1 unidade
    if (maxQuantity > 0 && maxQuantity < Infinity) {
      suggestions.push({
        product: {
          ...product,
          composition: product.composition.map((comp) => ({
            ...comp,
            rawMaterial:
              mockRawMaterials.find((rm) => rm.id === comp.rawMaterialId) ||
              comp.rawMaterial,
          })),
        },
        maxQuantity: maxQuantity,
        totalValue: product.value * maxQuantity,
        // REMOVI limitingFactor pois não existe na interface ProductionSuggestion
      });
    }
  });

  // Ordenar por maior valor total
  return suggestions.sort((a, b) => b.totalValue - a.totalValue);
};
