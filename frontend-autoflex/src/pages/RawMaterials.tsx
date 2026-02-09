import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { RawMaterialStockDialog } from "@/components/raw-materials/RawMaterialFormDialog";
import { useStore } from "@/store/useStore";
import { RawMaterial, Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Boxes, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function RawMaterials() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedRawMaterial, setSelectedRawMaterial] =
    useState<RawMaterial | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    rawMaterials,
    products,
    fetchRawMaterials,
    fetchProducts,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    loading: storeLoading,
  } = useStore();

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchRawMaterials(), fetchProducts()]);
    } catch (error: any) {
      console.error("Error loading raw materials:", error);
      setError(error.message || "Erro ao carregar matérias-primas");
      toast.error("Erro ao carregar matérias-primas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    setIsFormOpen(true);
  };

  const handleAdjustStock = (rawMaterial: RawMaterial) => {
    setSelectedRawMaterial(rawMaterial);
    setIsStockDialogOpen(true);
  };

  const handleDelete = (rawMaterial: RawMaterial) => {
    // Verificar se a matéria-prima está sendo usada em algum produto
    const isUsedInProducts = checkIfMaterialIsUsed(rawMaterial.id);

    if (isUsedInProducts) {
      toast.error(
        "Esta matéria-prima está sendo utilizada em um ou mais produtos. Remova a associação antes de excluir.",
      );
      return;
    }

    setSelectedRawMaterial(rawMaterial);
    setIsDeleteOpen(true);
  };

  // **CORREÇÃO:** Verificar se a matéria-prima está sendo usada (PostgreSQL)
  const checkIfMaterialIsUsed = (materialId: string): boolean => {
    return products.some((product) => {
      // Verificar em composition (frontend)
      if (
        product.composition?.some((comp) => comp.rawMaterialId === materialId)
      ) {
        return true;
      }

      // **CORREÇÃO:** Verificar em productMaterials (backend PostgreSQL)
      if (product.productMaterials && product.productMaterials.length > 0) {
        return product.productMaterials.some((pm: any) => {
          const rawMaterialId = String(
            pm.rawMaterial?.id || pm.rawMaterialId || "",
          );
          return rawMaterialId === materialId;
        });
      }

      return false;
    });
  };

  // **CORREÇÃO:** Obter produtos que usam a matéria-prima (PostgreSQL)
  const getProductsUsingMaterial = (materialId: string): Product[] => {
    return products.filter((product) => {
      // Verificar em composition (frontend)
      if (
        product.composition?.some((comp) => comp.rawMaterialId === materialId)
      ) {
        return true;
      }

      // **CORREÇÃO:** Verificar em productMaterials (backend PostgreSQL)
      if (product.productMaterials && product.productMaterials.length > 0) {
        return product.productMaterials.some((pm: any) => {
          const rawMaterialId = String(
            pm.rawMaterial?.id || pm.rawMaterialId || "",
          );
          return rawMaterialId === materialId;
        });
      }

      return false;
    });
  };

  const handleSave = async (
    data: Omit<RawMaterial, "id"> & { id?: string },
  ) => {
    try {
      if (data.id) {
        // Atualizar matéria-prima existente
        await updateRawMaterial(data.id, data);
        toast.success("Matéria-prima atualizada com sucesso!");
      } else {
        // Criar nova matéria-prima
        await addRawMaterial(data);
        toast.success("Matéria-prima criada com sucesso!");
      }

      // Recarregar lista
      await fetchRawMaterials();

      setSelectedRawMaterial(null);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Error saving raw material:", error);
      toast.error(error.message || "Erro ao salvar matéria-prima");
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (selectedRawMaterial) {
      try {
        await deleteRawMaterial(selectedRawMaterial.id);
        toast.success("Matéria-prima excluída com sucesso!");

        // Recarregar lista
        await fetchRawMaterials();

        setSelectedRawMaterial(null);
      } catch (error: any) {
        console.error("Error deleting raw material:", error);
        toast.error(error.message || "Erro ao excluir matéria-prima");
      } finally {
        setIsDeleteOpen(false);
      }
    }
  };

  // Calcular estoque baixo/crítico
  const lowStockMaterials = rawMaterials.filter((rm) => rm.stockQuantity <= 10);
  const criticalStockMaterials = rawMaterials.filter(
    (rm) => rm.stockQuantity <= 5,
  );

  const columns = [
    {
      key: "code" as keyof RawMaterial,
      header: "Código",
      render: (rm: RawMaterial) => (
        <div className="font-mono font-medium">{rm.code}</div>
      ),
    },
    {
      key: "name" as keyof RawMaterial,
      header: "Nome",
      render: (rm: RawMaterial) => {
        const productsUsing = getProductsUsingMaterial(rm.id);
        return (
          <div>
            <div className="font-medium">{rm.name}</div>
            {productsUsing.length > 0 && (
              <div className="text-xs text-primary mt-1">
                Em uso por {productsUsing.length} produto
                {productsUsing.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "stockQuantity" as keyof RawMaterial,
      header: "Estoque",
      render: (rm: RawMaterial) => {
        const stockLevel =
          rm.stockQuantity <= 5
            ? "critical"
            : rm.stockQuantity <= 10
              ? "low"
              : "good";

        const stockConfig = {
          critical: {
            color: "bg-red-100 text-red-800 border-red-200",
            label: "Crítico",
          },
          low: {
            color: "bg-yellow-100 text-yellow-800 border-yellow-200",
            label: "Baixo",
          },
          good: {
            color: "bg-green-100 text-green-800 border-green-200",
            label: "Bom",
          },
        };

        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${stockConfig[stockLevel].color}`}
              >
                {rm.stockQuantity} unidades
              </span>
              <span
                className={`text-xs ${stockLevel === "critical" ? "text-red-800" : stockLevel === "low" ? "text-yellow-800" : "text-green-800"}`}
              >
                {stockConfig[stockLevel].label}
              </span>
            </div>

            {rm.stockQuantity > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdjustStock(rm);
                }}
                className="h-7 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Ajustar
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "usage" as keyof RawMaterial,
      header: "Uso",
      render: (rm: RawMaterial) => {
        const productsUsing = getProductsUsingMaterial(rm.id);

        if (productsUsing.length === 0) {
          return (
            <Badge variant="outline" className="text-muted-foreground">
              Não utilizado
            </Badge>
          );
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {productsUsing.slice(0, 2).map((product) => (
              <Badge
                key={product.id}
                variant="secondary"
                className="text-xs truncate max-w-[80px]"
                title={product.name}
              >
                {product.code}
              </Badge>
            ))}
            {productsUsing.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{productsUsing.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
  ];

  if (isLoading || storeLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">
              Carregando matérias-primas...
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">
        Nenhuma matéria-prima cadastrada
      </h3>
      <p className="mt-2 text-muted-foreground">
        Comece cadastrando sua primeira matéria-prima para gerenciar seu
        estoque.
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          setSelectedRawMaterial(null);
          setIsFormOpen(true);
        }}
      >
        Cadastrar Primeira Matéria-Prima
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Matérias-Primas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as matérias-primas disponíveis em estoque
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={storeLoading}
            >
              {storeLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "Atualizar"
              )}
            </Button>
            <Button
              onClick={() => {
                setSelectedRawMaterial(null);
                setIsFormOpen(true);
              }}
            >
              Nova Matéria-Prima
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar matérias-primas</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={loadData}
            >
              Tentar novamente
            </Button>
          </Alert>
        )}

        {/* Alertas de estoque */}
        {criticalStockMaterials.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Estoque Crítico</AlertTitle>
            <AlertDescription>
              {criticalStockMaterials.length} matéria
              {criticalStockMaterials.length > 1 ? "s" : ""}-prima
              {criticalStockMaterials.length > 1 ? "s" : ""} com estoque crítico
              (≤ 5 unidades)
            </AlertDescription>
          </Alert>
        )}

        {lowStockMaterials.length > 0 &&
          criticalStockMaterials.length === 0 && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Estoque Baixo</AlertTitle>
              <AlertDescription className="text-yellow-700">
                {lowStockMaterials.length} matéria
                {lowStockMaterials.length > 1 ? "s" : ""}-prima
                {lowStockMaterials.length > 1 ? "s" : ""} com estoque baixo (≤
                10 unidades)
              </AlertDescription>
            </Alert>
          )}

        {/* Resumo do estoque */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-bold">{rawMaterials.length}</p>
              </div>
              <Boxes className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estoque Baixo
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {lowStockMaterials.length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Estoque Crítico
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {criticalStockMaterials.length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {rawMaterials.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable
            data={rawMaterials}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {selectedRawMaterial && (
          <DeleteConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onConfirm={confirmDelete}
            title={`Excluir matéria-prima "${selectedRawMaterial.name}"`}
            description={
              checkIfMaterialIsUsed(selectedRawMaterial.id)
                ? `Esta matéria-prima está sendo utilizada por ${getProductsUsingMaterial(selectedRawMaterial.id).length} produto${getProductsUsingMaterial(selectedRawMaterial.id).length !== 1 ? "s" : ""}. Remova a associação antes de excluir.`
                : "Esta ação não pode ser desfeita."
            }
          />
        )}
      </div>
    </MainLayout>
  );
}
