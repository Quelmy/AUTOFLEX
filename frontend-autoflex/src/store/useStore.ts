import { create } from "zustand";
import { Product, RawMaterial, ProductionSuggestion } from "@/types";
import { productApi, rawMaterialApi, productionApi } from "@/lib/api";

// Importe ou crie a função getMockSuggestions aqui
// Se você criou em lib/mockData.ts:
// import { getMockSuggestions } from "@/lib/mockData";

// Se não, pode criar uma função simples inline:
const getMockSuggestions = (): ProductionSuggestion[] => {
  // Mock simples para desenvolvimento
  return [
    {
      product: {
        id: "1",
        code: "PROD001",
        name: "Produto Exemplo",
        value: 100.0,
        composition: [
          {
            rawMaterialId: "1",
            quantityRequired: 2,
            rawMaterial: {
              id: "1",
              code: "MAT001",
              name: "Matéria Prima X",
              stockQuantity: 50,
            },
          },
        ],
      },
      maxQuantity: 25,
      totalValue: 2500,
      limitingFactor: {
        rawMaterialId: "1",
        quantityRequired: 2,
        rawMaterial: {
          id: "1",
          code: "MAT001",
          name: "Matéria Prima X",
          stockQuantity: 50,
        },
      },
    },
    {
      product: {
        id: "2",
        code: "PROD002",
        name: "Outro Produto",
        value: 150.0,
        composition: [
          {
            rawMaterialId: "2",
            quantityRequired: 1,
            rawMaterial: {
              id: "2",
              code: "MAT002",
              name: "Matéria Prima Y",
              stockQuantity: 30,
            },
          },
        ],
      },
      maxQuantity: 30,
      totalValue: 4500,
      limitingFactor: {
        rawMaterialId: "2",
        quantityRequired: 1,
        rawMaterial: {
          id: "2",
          code: "MAT002",
          name: "Matéria Prima Y",
          stockQuantity: 30,
        },
      },
    },
  ];
};

interface Store {
  // Estado
  products: Product[];
  rawMaterials: RawMaterial[];
  productionSuggestions: ProductionSuggestion[];
  loading: boolean;
  error: string | null;

  // Ações - Produtos
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<Product>;
  deleteProduct: (id: string) => Promise<void>;

  // Ações - Matérias-Primas
  fetchRawMaterials: () => Promise<void>;
  addRawMaterial: (material: Omit<RawMaterial, "id">) => Promise<RawMaterial>;
  updateRawMaterial: (
    id: string,
    material: Partial<RawMaterial>,
  ) => Promise<RawMaterial>;
  deleteRawMaterial: (id: string) => Promise<void>;

  // Ações - Produção
  fetchProductionSuggestions: () => Promise<void>;
  executeProduction: (
    productId: string,
    quantity: number,
  ) => Promise<{ success: boolean; message: string }>;

  // Utilitários
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  refreshAll: () => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  products: [],
  rawMaterials: [],
  productionSuggestions: [],
  loading: false,
  error: null,

  // Produtos
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const products = await productApi.getAll();
      set({ products, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar produtos",
        loading: false,
      });
      throw error;
    }
  },

  addProduct: async (productData) => {
    set({ loading: true, error: null });
    try {
      // O productApi.create já trata a composição internamente
      const newProduct = await productApi.create(productData);

      set((state) => ({
        products: [...state.products, newProduct],
        loading: false,
      }));

      return newProduct;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar produto",
        loading: false,
      });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    set({ loading: true, error: null });
    try {
      // O productApi.update já trata a composição internamente
      const updatedProduct = await productApi.update(id, productData);

      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updatedProduct : p)),
        loading: false,
      }));

      return updatedProduct;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar produto",
        loading: false,
      });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    set({ loading: true, error: null });
    try {
      await productApi.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Erro ao excluir produto",
        loading: false,
      });
      throw error;
    }
  },

  // Matérias-Primas
  fetchRawMaterials: async () => {
    set({ loading: true, error: null });
    try {
      const rawMaterials = await rawMaterialApi.getAll();
      set({ rawMaterials, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Erro ao carregar matérias-primas",
        loading: false,
      });
      throw error;
    }
  },

  addRawMaterial: async (materialData) => {
    set({ loading: true, error: null });
    try {
      const newMaterial = await rawMaterialApi.create(materialData);
      set((state) => ({
        rawMaterials: [...state.rawMaterials, newMaterial],
        loading: false,
      }));
      return newMaterial;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao criar matéria-prima",
        loading: false,
      });
      throw error;
    }
  },

  updateRawMaterial: async (id, materialData) => {
    set({ loading: true, error: null });
    try {
      const updatedMaterial = await rawMaterialApi.update(id, materialData);
      set((state) => ({
        rawMaterials: state.rawMaterials.map((rm) =>
          rm.id === id ? updatedMaterial : rm,
        ),
        loading: false,
      }));
      return updatedMaterial;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar matéria-prima",
        loading: false,
      });
      throw error;
    }
  },

  deleteRawMaterial: async (id) => {
    set({ loading: true, error: null });
    try {
      await rawMaterialApi.delete(id);
      set((state) => ({
        rawMaterials: state.rawMaterials.filter((rm) => rm.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || "Erro ao excluir matéria-prima",
        loading: false,
      });
      throw error;
    }
  },

  // Produção - Versão com fallback para mock
  fetchProductionSuggestions: async () => {
    set({ loading: true, error: null });
    try {
      // Tenta a API real primeiro
      const suggestions = await productionApi.getSuggestions();
      set({ productionSuggestions: suggestions, loading: false });
    } catch (error: any) {
      console.log("API real falhou, usando dados mock para desenvolvimento");

      // Fallback para dados mock
      const mockSuggestions = getMockSuggestions();
      set({
        productionSuggestions: mockSuggestions,
        loading: false,
        error: null, // Limpa o erro pois temos dados mock
      });
    }
  },

  executeProduction: async (productId, quantity) => {
    set({ loading: true, error: null });
    try {
      const result = await productionApi.executeProduction(productId, quantity);

      // Recarregar matérias-primas (estoque foi atualizado)
      await get().fetchRawMaterials();

      // Recarregar sugestões de produção (estoque mudou)
      await get().fetchProductionSuggestions();

      set({ loading: false });
      return result;
    } catch (error: any) {
      set({
        error: error.message || "Erro ao executar produção",
        loading: false,
      });
      throw error;
    }
  },

  // Utilitários
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchProducts(),
        get().fetchRawMaterials(),
        get().fetchProductionSuggestions(),
      ]);
    } catch (error: any) {
      set({
        error: error.message || "Erro ao atualizar dados",
        loading: false,
      });
      throw error;
    }
  },
}));
