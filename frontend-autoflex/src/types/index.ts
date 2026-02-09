// @/types/index.ts

// ========== TIPOS BÁSICOS ==========

export interface RawMaterial {
  id: string; // Frontend usa string (convertido de number do backend)
  code: string;
  name: string;
  stockQuantity: number;
}

// CORREÇÃO: Tipos para dados do backend PostgreSQL
export interface BackendRawMaterial {
  id: number; // Backend usa number
  code: string;
  name: string;
  stock_quantity: number; // snake_case do PostgreSQL
}

export interface ProductRawMaterial {
  rawMaterialId: string; // Frontend usa string
  rawMaterial?: RawMaterial; // Opcional
  quantityRequired: number;
}

// CORREÇÃO: Tipos para dados do backend PostgreSQL
export interface BackendProductMaterial {
  id: number; // ID da associação
  required_quantity: number; // snake_case
  raw_material_id: number; // snake_case
  rawMaterial?: BackendRawMaterial; // Pode vir aninhado
}

export interface Product {
  id: string; // Frontend usa string
  code: string;
  name: string;
  value: number;
  composition: ProductRawMaterial[];

  // Campo opcional para dados diretos do backend
  // O PostgreSQL retorna IDs como number
  productMaterials?: Array<{
    id: number; // ID da associação
    requiredQuantity: number; // camelCase convertido
    rawMaterial?: {
      id: number; // ID da matéria-prima (number no backend)
      code: string;
      name: string;
      stockQuantity: number; // camelCase convertido de stock_quantity
    };
  }>;
}

// CORREÇÃO: Tipo para backend PostgreSQL
export interface BackendProduct {
  id: number; // Backend usa number
  code: string;
  name: string;
  value: number;
  created_at?: string;
  updated_at?: string;
  productMaterials?: BackendProductMaterial[]; // snake_case ou camelCase?
}

// ========== PRODUÇÃO ==========

export interface ProductionSuggestion {
  product: Product;
  maxQuantity: number;
  totalValue: number;
  limitingFactor?: {
    rawMaterialId: string; // Convertido para string
    quantityRequired: number;
    rawMaterial: RawMaterial;
  };
}

// ========== FORMULÁRIOS ==========

export interface ProductFormData {
  code: string;
  name: string;
  value: number;
  composition: ProductRawMaterial[];
}

export interface RawMaterialFormData {
  code: string;
  name: string;
  stockQuantity: number;
}

// ========== ESTOQUE ==========

export interface StockAdjustment {
  rawMaterialId: string;
  adjustmentType: "increase" | "decrease";
  quantity: number;
  reason?: string;
}

// ========== RESPOSTAS DA API ==========

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface ProductionExecutionResult {
  success: boolean;
  message: string;
  productId?: string; // Pode vir como string mesmo que backend use number
  quantity?: number;
  product?: {
    id: number; // Backend retorna number
    name: string;
    code: string;
  };
}

// ========== FILTROS ==========

export interface ProductFilters {
  code?: string;
  name?: string;
  minValue?: number;
  maxValue?: number;
}

export interface RawMaterialFilters {
  code?: string;
  name?: string;
  minStock?: number;
  maxStock?: number;
}

// ========== DASHBOARD ==========

export interface DashboardStats {
  totalProducts: number;
  totalRawMaterials: number;
  lowStockMaterials: number;
  criticalStockMaterials: number;
  totalProductionValue: number;
  totalProducibleUnits: number;
}

// ========== COMPOSIÇÃO DETALHADA ==========

export interface CompositionDetail {
  rawMaterial: RawMaterial;
  quantityRequired: number;
  totalRequired: number;
  availableStock: number;
  hasEnoughStock: boolean;
}

// ========== SUGESTÕES DETALHADAS ==========

export interface DetailedProductionSuggestion extends ProductionSuggestion {
  compositionDetails: CompositionDetail[];
  canProduce: boolean;
  limitingMaterial?: {
    rawMaterial: RawMaterial;
    available: number;
    required: number;
  };
}

// ========== VALIDAÇÃO ==========

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

// ========== OPERAÇÕES EM LOTE ==========

export interface BatchOperation {
  ids: string[];
  operation: "delete" | "update" | "export";
}

// ========== EXPORTAÇÃO ==========

export interface ExportData {
  products: Product[];
  rawMaterials: RawMaterial[];
  productionSuggestions: ProductionSuggestion[];
  timestamp: string;
}

// ========== HISTÓRICO ==========

export interface ProductionHistory {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  totalValue: number;
  executedAt: string;
  materialsUsed: Array<{
    rawMaterialId: string;
    rawMaterialCode: string;
    rawMaterialName: string;
    quantityUsed: number;
    previousStock: number;
    newStock: number;
  }>;
}

// ========== ENUMS ==========

export enum StockStatus {
  CRITICAL = "critical", // ≤ 5 unidades
  LOW = "low", // ≤ 10 unidades
  NORMAL = "normal", // > 10 unidades
  OVERSTOCK = "overstock", // > 100 unidades
}

export enum ProductStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
}

// ========== FUNÇÕES UTILITÁRIAS DE TIPO ==========

export type WithId<T> = T & { id: string };
export type OptionalId<T> = Omit<T, "id"> & { id?: string };
export type PartialWithId<T> = Partial<T> & { id: string };

// ========== PAGINAÇÃO ==========

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

// ========== RELATÓRIOS ==========

export interface InventoryReport {
  generatedAt: string;
  summary: {
    totalProducts: number;
    totalRawMaterials: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  products: Array<{
    id: string;
    code: string;
    name: string;
    value: number;
    compositionCount: number;
  }>;
  rawMaterials: Array<{
    id: string;
    code: string;
    name: string;
    stockQuantity: number;
    stockStatus: StockStatus;
    usedInProducts: number;
  }>;
  productionSuggestions: ProductionSuggestion[];
}

// ========== NOTIFICAÇÕES ==========

export interface Notification {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ========== CONFIGURAÇÃO DO SISTEMA ==========

export interface SystemSettings {
  currency: string;
  lowStockThreshold: number;
  criticalStockThreshold: number;
  defaultPageSize: number;
  enableNotifications: boolean;
  autoRefreshInterval: number;
}

// ========== FUNÇÕES DE CONVERSÃO (ADICIONE AQUI) ==========

/**
 * Converte RawMaterial do backend (number IDs) para frontend (string IDs)
 */
export function convertBackendRawMaterial(
  backend: BackendRawMaterial,
): RawMaterial {
  return {
    id: String(backend.id), // Converte number para string
    code: backend.code,
    name: backend.name,
    stockQuantity: backend.stock_quantity, // Converte snake_case para camelCase
  };
}

/**
 * Converte Product do backend para frontend
 */
export function convertBackendProduct(backend: BackendProduct): Product {
  return {
    id: String(backend.id), // Converte number para string
    code: backend.code,
    name: backend.name,
    value: backend.value,
    composition: [], // Será preenchido pelo api.ts
    productMaterials: backend.productMaterials?.map((pm) => ({
      id: pm.id,
      requiredQuantity: pm.required_quantity,
      rawMaterial: pm.rawMaterial
        ? {
            id: pm.rawMaterial.id, // Mantém como number (será convertido depois)
            code: pm.rawMaterial.code,
            name: pm.rawMaterial.name,
            stockQuantity: pm.rawMaterial.stock_quantity,
          }
        : undefined,
    })),
  };
}

/**
 * Verifica se o ID é string (frontend) ou number (backend)
 */
export function isStringId(id: any): id is string {
  return typeof id === "string";
}

/**
 * Converte ID para string (para uso no frontend)
 */
export function ensureStringId(id: string | number): string {
  return typeof id === "number" ? String(id) : id;
}

/**
 * Converte ID para number (para envio ao backend)
 */
export function ensureNumberId(id: string | number): number {
  return typeof id === "string" ? parseInt(id) || 0 : id;
}
