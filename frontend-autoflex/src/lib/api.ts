import { Product, ProductionSuggestion, RawMaterial } from "@/types";

// @/lib/api.ts
const API_URL = "http://localhost:8080";

// Tipos para o Spring Boot 
interface SpringRawMaterial {
  id: number;
  code: string;
  name: string;
  unit: string;
  quantity: number; 
  unitPrice: number; 
}

interface SpringProduct {
  id: number;
  code: string;
  name: string;
  value: number;
}

interface SpringProductionSuggestion {
  product: SpringProduct;
  maxQuantity: number;
  totalValue: number;
  materialDetails?: Array<{
    rawMaterialId: number;
    rawMaterialName: string;
    requiredQuantity: number;
    available: number;
  }>;
}

// Converter Spring RawMaterial para RawMaterial do frontend - CORRIGIDO
const convertSpringToRawMaterial = (
  spring: SpringRawMaterial,
): RawMaterial => ({
  id: String(spring.id),
  code: spring.code,
  name: spring.name,
  stockQuantity: spring.quantity || 0, // Spring Boot retorna "quantity", mapeia para "stockQuantity"
  // Ignorar unit e unitPrice pois RawMaterial não tem essas propriedades
});

// Função SIMPLIFICADA para buscar produtos (sem materiais para evitar erro 500)
const convertSpringToProduct = (spring: SpringProduct): Product => ({
  id: String(spring.id),
  code: spring.code,
  name: spring.name,
  value: spring.value || 0,
  composition: [], 
  productMaterials: [],
});

// API para Produtos 
export const productApi = {
  getAll: async (): Promise<Product[]> => {
    console.log("Fetching products from:", `${API_URL}/products`);
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch products: ${error}`);
      }
      const springProducts: SpringProduct[] = await response.json();

      // Converter produtos SEM buscar materiais 
      const products = springProducts.map(convertSpringToProduct);

      console.log("Products loaded (simplified):", products.length);
      return products;
    } catch (error) {
      console.error("Error in productApi.getAll:", error);
      return [];
    }
  },

  getById: async (id: string): Promise<Product> => {
    console.log("Fetching product:", id);
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch product: ${error}`);
      }
      const springProduct: SpringProduct = await response.json();
      return convertSpringToProduct(springProduct);
    } catch (error) {
      console.error("Error in productApi.getById:", error);
      // Retornar produto vazio em caso de erro
      return {
        id: id,
        code: "",
        name: "",
        value: 0,
        composition: [],
        productMaterials: [],
      };
    }
  },

  create: async (productData: Omit<Product, "id">): Promise<Product> => {
    console.log("Creating product:", productData);
    const springData = {
      code: productData.code,
      name: productData.name,
      value: productData.value,
    };

    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(springData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create product: ${error}`);
    }

    const createdProduct: SpringProduct = await response.json();
    return convertSpringToProduct(createdProduct);
  },

  update: async (
    id: string,
    productData: Partial<Product>,
  ): Promise<Product> => {
    console.log("Updating product:", id, productData);
    const springData: any = {};

    if (productData.code !== undefined) springData.code = productData.code;
    if (productData.name !== undefined) springData.name = productData.name;
    if (productData.value !== undefined) springData.value = productData.value;

    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(springData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update product: ${error}`);
    }

    const updatedProduct: SpringProduct = await response.json();
    return convertSpringToProduct(updatedProduct);
  },

  delete: async (id: string): Promise<void> => {
    console.log("Deleting product:", id);
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete product: ${error}`);
    }
  },

  addMaterial: async (
    productId: string,
    rawMaterialId: string,
    quantity: number,
  ): Promise<void> => {
    console.log("Adding material to product:", {
      productId,
      rawMaterialId,
      quantity,
    });

    const url = `${API_URL}/products/${productId}/materials?rawMaterialId=${rawMaterialId}&requiredQuantity=${quantity}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to add material: ${error}`);
    }
  },

  removeMaterial: async (
    productId: string,
    rawMaterialId: string,
  ): Promise<void> => {
    console.log("Removing material from product:", {
      productId,
      rawMaterialId,
    });
    const response = await fetch(
      `${API_URL}/products/${productId}/materials/${rawMaterialId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to remove material: ${error}`);
    }
  },
};


export const rawMaterialApi = {
  getAll: async (): Promise<RawMaterial[]> => {
    console.log("Fetching raw materials from:", `${API_URL}/raw-materials`);
    try {
      const response = await fetch(`${API_URL}/raw-materials`);
      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to fetch raw materials:", error);
        return []; // Retorna array vazio 
      }

      const springMaterials: SpringRawMaterial[] = await response.json();
      console.log("Raw materials received:", springMaterials.length);

      if (springMaterials.length > 0) {
        console.log("First raw material sample:", {
          id: springMaterials[0].id,
          code: springMaterials[0].code,
          name: springMaterials[0].name,
          quantity: springMaterials[0].quantity,
          unit: springMaterials[0].unit,
          unitPrice: springMaterials[0].unitPrice,
        });
      }

      return springMaterials.map(convertSpringToRawMaterial);
    } catch (error) {
      console.error("Error in rawMaterialApi.getAll:", error);
      return []; // Retorna array vazio em caso de erro
    }
  },

  create: async (
    materialData: Omit<RawMaterial, "id">,
  ): Promise<RawMaterial> => {
    console.log("Creating raw material:", materialData);

    
    const springData = {
      code: materialData.code,
      name: materialData.name,
      quantity: materialData.stockQuantity || 0,
      unit: "un", // Valor padrão
      unitPrice: 0.0, // Valor padrão
    };

    const response = await fetch(`${API_URL}/raw-materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(springData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create raw material: ${error}`);
    }

    const createdMaterial: SpringRawMaterial = await response.json();
    console.log("Raw material created:", createdMaterial);
    return convertSpringToRawMaterial(createdMaterial);
  },

  update: async (
    id: string,
    materialData: Partial<RawMaterial>,
  ): Promise<RawMaterial> => {
    console.log("Updating raw material:", id, materialData);
    const springData: any = {};

    if (materialData.code !== undefined) springData.code = materialData.code;
    if (materialData.name !== undefined) springData.name = materialData.name;
    if (materialData.stockQuantity !== undefined)
      springData.quantity = materialData.stockQuantity;

    const response = await fetch(`${API_URL}/raw-materials/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(springData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update raw material: ${error}`);
    }

    const updatedMaterial: SpringRawMaterial = await response.json();
    return convertSpringToRawMaterial(updatedMaterial);
  },

  delete: async (id: string): Promise<void> => {
    console.log("Deleting raw material:", id);
    const response = await fetch(`${API_URL}/raw-materials/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to delete raw material: ${error}`);
    }
  },

  updateStock: async (id: string, quantity: number): Promise<RawMaterial> => {
    console.log("Updating stock:", id, quantity);
    const url = `${API_URL}/raw-materials/${id}/stock?quantity=${quantity}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update stock: ${error}`);
    }

    const updatedMaterial: SpringRawMaterial = await response.json();
    return convertSpringToRawMaterial(updatedMaterial);
  },
};


export const productionApi = {
  getSuggestions: async (): Promise<ProductionSuggestion[]> => {
    console.log(
      "Fetching production suggestions from:",
      `${API_URL}/production/suggestions`,
    );

    try {
      const response = await fetch(`${API_URL}/production/suggestions`);

      if (!response.ok) {
        console.error("Error fetching suggestions:", response.status);
        return []; // Retorna array vazio
      }

      const springData: SpringProductionSuggestion[] = await response.json();
      console.log("Production suggestions received:", springData?.length || 0);

      if (springData.length > 0) {
        console.log("First suggestion sample:", {
          product: springData[0].product,
          maxQuantity: springData[0].maxQuantity,
          totalValue: springData[0].totalValue,
        });
      }

      // Converter sugestões de forma SIMPLES
      const suggestions = springData.map(
        (suggestion: SpringProductionSuggestion) => {
          // Criar produto básico
          const product: Product = {
            id: String(suggestion.product.id),
            code: suggestion.product.code,
            name: suggestion.product.name,
            value: suggestion.product.value,
            composition: [],
            productMaterials: [],
          };

          return {
            product,
            maxQuantity: suggestion.maxQuantity || 0,
            totalValue: suggestion.totalValue || 0,
            materialDetails: suggestion.materialDetails,
          };
        },
      );

      console.log("Suggestions processed:", suggestions.length);
      return suggestions;
    } catch (error) {
      console.error("Error in productionApi.getSuggestions:", error);
      return []; // Retorna array vazio
    }
  },

  executeProduction: async (
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; message: string }> => {
    console.log("Executing production:", { productId, quantity });

    try {
      const url = `${API_URL}/production/simulate`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: parseInt(productId),
          quantity: quantity,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return {
          success: false,
          message: `Erro: ${errorText}`,
        };
      }

      const result = await response.json();
      console.log("Production simulation result:", result);

      if (result.canProduce) {
        return {
          success: true,
          message: `Pode produzir ${quantity} unidades. Valor total: R$ ${result.totalValue}`,
        };
      } else {
        return {
          success: false,
          message: `Não pode produzir: estoque insuficiente`,
        };
      }
    } catch (error: any) {
      console.error("Exception in executeProduction:", error);
      return {
        success: false,
        message: `Erro de conexão: ${error.message}`,
      };
    }
  },
};


export const healthApi = {
  check: async (): Promise<{ status: string; message: string }> => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        return {
          status: "ERROR",
          message: `API responded with ${response.status}`,
        };
      }
      const data = await response.json();
      return {
        status: data.status || "UNKNOWN",
        message: data.service || "Spring Boot API",
      };
    } catch (error) {
      return {
        status: "OFFLINE",
        message: "Cannot connect to API",
      };
    }
  },
};


export const testApiConnection = async () => {
  console.log("=== TESTANDO CONEXÃO COM API SPRING BOOT ===");

  try {
    // Teste 1: Health
    console.log("1. Testando health endpoint...");
    const health = await healthApi.check();
    console.log(" Health:", health);

    // Teste 2: Raw Materials
    console.log("2. Testando raw materials...");
    const rawResponse = await fetch(`${API_URL}/raw-materials`);
    if (rawResponse.ok) {
      const rawData = await rawResponse.json();
      console.log(` Raw Materials: ${rawData.length} itens`);
      console.log("Amostra:", rawData.slice(0, 2));
    } else {
      console.log(` Raw Materials: ${rawResponse.status}`);
    }

    // Teste 3: Products
    console.log("3. Testando products...");
    const productsResponse = await fetch(`${API_URL}/products`);
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(` Products: ${productsData.length} itens`);
      console.log("Amostra:", productsData.slice(0, 2));
    } else {
      console.log(` Products: ${productsResponse.status}`);
    }

    // Teste 4: Production Suggestions
    console.log("4. Testando production suggestions...");
    const prodResponse = await fetch(`${API_URL}/production/suggestions`);
    if (prodResponse.ok) {
      const prodData = await prodResponse.json();
      console.log(`Production Suggestions: ${prodData.length} itens`);
      console.log("Amostra:", prodData[0]);
    } else {
      console.log(
        ` Production Suggestions: ${prodResponse.status} (pode ser normal)`,
      );
    }
  } catch (error) {
    console.error(" Erro no teste:", error);
  }

  console.log("=== FIM DO TESTE ===");

  // Para executar no console do navegador:
  return "Teste concluído. Verifique o console.";
};

// Tipos exportados
export type { SpringRawMaterial, SpringProduct, SpringProductionSuggestion };
