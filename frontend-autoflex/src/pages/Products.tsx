import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { useStore } from "@/store/useStore";
import { Product } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Products() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    products,
    rawMaterials,
    fetchProducts,
    fetchRawMaterials,
    addProduct,
    updateProduct,
    deleteProduct,
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
      await Promise.all([fetchProducts(), fetchRawMaterials()]);
    } catch (error: any) {
      console.error("Error loading products:", error);
      setError(error.message || "Erro ao carregar produtos");
      toast.error("Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getRawMaterialName = (id: string): string => {
    const material = rawMaterials.find((rm) => rm.id === id);
    return material?.name || "N/A";
  };

  const getRawMaterialCode = (id: string): string => {
    const material = rawMaterials.find((rm) => rm.id === id);
    return material?.code || "";
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleSave = async (data: Omit<Product, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        // Atualizar produto existente
        await updateProduct(data.id, data);
        toast.success("Produto atualizado com sucesso!");
      } else {
        // Criar novo produto
        await addProduct(data);
        toast.success("Produto criado com sucesso!");
      }

      // Recarregar lista de produtos
      await fetchProducts();

      setSelectedProduct(null);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Erro ao salvar produto");
      throw error; // Re-throw para o ProductFormDialog tratar
    }
  };

  const handleSaveSuccess = async () => {
    await fetchProducts();
  };

  const confirmDelete = async () => {
    if (selectedProduct) {
      try {
        await deleteProduct(selectedProduct.id);
        toast.success("Produto excluído com sucesso!");

        // Recarregar lista
        await fetchProducts();

        setSelectedProduct(null);
      } catch (error: any) {
        console.error("Error deleting product:", error);
        toast.error(error.message || "Erro ao excluir produto");
      } finally {
        setIsDeleteOpen(false);
      }
    }
  };

  
  const getProductComposition = (product: Product) => {

    if (product.productMaterials && product.productMaterials.length > 0) {
      return product.productMaterials.map((pm: any) => {
        const rawMaterial = pm.rawMaterial || {};
        return {
          rawMaterialId: String(rawMaterial.id || pm.rawMaterialId || ""),
          rawMaterial: {
            id: String(rawMaterial.id || ""),
            code: rawMaterial.code || "",
            name: rawMaterial.name || "Material desconhecido",
            stockQuantity: rawMaterial.stockQuantity || 0,
          },
          quantityRequired: pm.requiredQuantity || 0,
        };
      });
    }

    if (product.composition && product.composition.length > 0) {
      return product.composition;
    }

    return [];
  };

  const columns = [
    {
      key: "code" as keyof Product,
      header: "Código",
      render: (product: Product) => (
        <div className="font-mono font-medium">{product.code}</div>
      ),
    },
    {
      key: "name" as keyof Product,
      header: "Nome",
      render: (product: Product) => {
        const composition = getProductComposition(product);
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            {composition.length === 0 && (
              <div className="text-xs text-yellow-600">
                Sem matérias-primas associadas
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "value" as keyof Product,
      header: "Valor",
      render: (product: Product) => (
        <span className="font-semibold text-primary whitespace-nowrap">
          {formatCurrency(product.value)}
        </span>
      ),
    },
    {
      key: "composition" as keyof Product,
      header: "Composição",
      render: (product: Product) => {
        const composition = getProductComposition(product);

        if (composition.length === 0) {
          return (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              Sem composição
            </Badge>
          );
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {composition.slice(0, 3).map((comp, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <span className="truncate max-w-[100px]">
                  {comp.rawMaterial?.name ||
                    getRawMaterialName(comp.rawMaterialId)}
                </span>
                <span className="font-bold">×{comp.quantityRequired}</span>
              </Badge>
            ))}
            {composition.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{composition.length - 3}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: "details" as keyof Product,
      header: "Detalhes",
      render: (product: Product) => {
        const composition = getProductComposition(product);
        return (
          <div className="text-xs text-muted-foreground">
            {composition.length} matéria{composition.length !== 1 ? "s" : ""}
            -prima{composition.length !== 1 ? "s" : ""}
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
            <p className="mt-4 text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Nenhum produto cadastrado</h3>
      <p className="mt-2 text-muted-foreground">
        Comece cadastrando seu primeiro produto para gerenciar sua produção.
      </p>
      <Button
        className="mt-4"
        onClick={() => {
          setSelectedProduct(null);
          setIsFormOpen(true);
        }}
      >
        Cadastrar Primeiro Produto
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Produtos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os produtos fabricados pela indústria
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
                setSelectedProduct(null);
                setIsFormOpen(true);
              }}
            >
              Novo Produto
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar produtos</AlertTitle>
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

        {rawMaterials.length === 0 && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">
              Cadastre matérias-primas primeiro
            </AlertTitle>
            <AlertDescription className="text-yellow-700">
              Para associar matérias-primas aos produtos, é necessário cadastrar
              as matérias-primas primeiro. Acesse a página de Matérias-Primas.
            </AlertDescription>
          </Alert>
        )}

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <DataTable
            data={products}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        <ProductFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setSelectedProduct(null);
          }}
          product={selectedProduct}
          onSaveSuccess={handleSaveSuccess}
        />

        {selectedProduct && (
          <DeleteConfirmDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            onConfirm={confirmDelete}
            title={`Excluir produto "${selectedProduct.name}"`}
            description="Esta ação não pode ser desfeita. Todas as associações com matérias-primas serão removidas."
          />
        )}
      </div>
    </MainLayout>
  );
}
