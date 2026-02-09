import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, ProductRawMaterial, RawMaterial } from "@/types";
import { useStore } from "@/store/useStore";
import { Plus, Trash2 } from "lucide-react";

const productSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  value: z.number().min(0.01, "Valor deve ser maior que zero"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSaveSuccess?: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaveSuccess,
}: ProductFormDialogProps) {
  const {
    rawMaterials,
    addProduct,
    updateProduct,
    fetchProducts,
    loading: storeLoading,
  } = useStore();
  const [composition, setComposition] = useState<ProductRawMaterial[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      code: "",
      name: "",
      value: 0,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        code: product.code,
        name: product.name,
        value: product.value,
      });

      // Converter do formato backend para frontend
      if (product.productMaterials) {
        const convertedComposition = product.productMaterials.map(
          (pm: any) => ({
            rawMaterialId: String(pm.rawMaterial.id),
            rawMaterial: {
              id: String(pm.rawMaterial.id),
              code: pm.rawMaterial.code,
              name: pm.rawMaterial.name,
              stockQuantity: pm.rawMaterial.stockQuantity,
            },
            quantityRequired: pm.requiredQuantity,
          }),
        );
        setComposition(convertedComposition);
      } else if (product.composition) {
        setComposition(product.composition);
      } else {
        setComposition([]);
      }
    } else {
      form.reset({
        code: "",
        name: "",
        value: 0,
      });
      setComposition([]);
    }
    setError(null);
  }, [product, form, open]);

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Criar objeto com os tipos corretos para a store
      const productData = {
        code: data.code,
        name: data.name,
        value: data.value,
        composition,
      };

      if (product?.id) {
        // Para update, enviar com id separado
        await updateProduct(product.id, productData);
      } else {
        // Para create, enviar sem id
        await addProduct(productData);
      }

      onOpenChange(false);
      form.reset({
        code: "",
        name: "",
        value: 0,
      });
      setComposition([]);

      await fetchProducts();

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error: any) {
      console.error("Error saving product:", error);
      setError(error.message || "Erro ao salvar produto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCompositionItem = () => {
    if (rawMaterials.length === 0) return;

    const availableRawMaterials = rawMaterials.filter(
      (rm) => !composition.find((c) => c.rawMaterialId === rm.id),
    );

    if (availableRawMaterials.length === 0) return;

    setComposition([
      ...composition,
      {
        rawMaterialId: availableRawMaterials[0].id,
        rawMaterial: availableRawMaterials[0],
        quantityRequired: 1,
      },
    ]);
  };

  const removeCompositionItem = (index: number) => {
    setComposition(composition.filter((_, i) => i !== index));
  };

  const updateCompositionItem = (
    index: number,
    field: "rawMaterialId" | "quantityRequired",
    value: string | number,
  ) => {
    const updated = [...composition];

    if (field === "rawMaterialId") {
      const selectedMaterial = rawMaterials.find((rm) => rm.id === value);
      if (selectedMaterial) {
        updated[index] = {
          ...updated[index],
          rawMaterialId: value as string,
          rawMaterial: selectedMaterial,
        };
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: value as number,
      };
    }

    setComposition(updated);
  };

  const getRawMaterialName = (id: string): string => {
    const compositionItem = composition.find((c) => c.rawMaterialId === id);
    if (compositionItem?.rawMaterial?.name) {
      return compositionItem.rawMaterial.name;
    }
    return rawMaterials.find((rm) => rm.id === id)?.name || "";
  };

  const getRawMaterialCode = (id: string): string => {
    const compositionItem = composition.find((c) => c.rawMaterialId === id);
    if (compositionItem?.rawMaterial?.code) {
      return compositionItem.rawMaterial.code;
    }
    return rawMaterials.find((rm) => rm.id === id)?.code || "";
  };

  const hasEnoughStock = (rawMaterialId: string, quantity: number): boolean => {
    const material = rawMaterials.find((rm) => rm.id === rawMaterialId);
    if (!material) return false;

    const totalRequiredForMaterial = composition.reduce((sum, item) => {
      if (item.rawMaterialId === rawMaterialId) {
        return sum + item.quantityRequired;
      }
      return sum;
    }, 0);

    return material.stockQuantity >= totalRequiredForMaterial;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: PROD001"
                        {...field}
                        disabled={isSubmitting || storeLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome do produto"
                        {...field}
                        disabled={isSubmitting || storeLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={field.value || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={isSubmitting || storeLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">
                    Composição (Matérias-Primas)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Associe as matérias-primas necessárias para produzir este
                    produto
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCompositionItem}
                  disabled={
                    rawMaterials.length === 0 ||
                    composition.length >= rawMaterials.length ||
                    isSubmitting ||
                    storeLoading
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              {rawMaterials.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma matéria-prima cadastrada.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cadastre matérias-primas primeiro para associá-las ao
                    produto.
                  </p>
                </div>
              ) : composition.length === 0 ? (
                <div className="text-center p-4 border border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma matéria-prima associada.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Clique em "Adicionar" para incluir matérias-primas na
                    composição.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {composition.map((item, index) => {
                    const material = rawMaterials.find(
                      (rm) => rm.id === item.rawMaterialId,
                    );
                    const hasStock = hasEnoughStock(
                      item.rawMaterialId,
                      item.quantityRequired,
                    );

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded-lg border p-3 ${
                          hasStock
                            ? "border-border"
                            : "border-destructive/50 bg-destructive/5"
                        }`}
                      >
                        <div className="flex-1">
                          <Select
                            value={item.rawMaterialId}
                            onValueChange={(value) =>
                              updateCompositionItem(
                                index,
                                "rawMaterialId",
                                value,
                              )
                            }
                            disabled={isSubmitting || storeLoading}
                          >
                            <SelectTrigger>
                              <SelectValue>
                                {getRawMaterialName(item.rawMaterialId)} (
                                {getRawMaterialCode(item.rawMaterialId)})
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {rawMaterials.map((rm) => (
                                <SelectItem
                                  key={rm.id}
                                  value={rm.id}
                                  disabled={
                                    composition.some(
                                      (c, i) =>
                                        i !== index &&
                                        c.rawMaterialId === rm.id,
                                    ) ||
                                    isSubmitting ||
                                    storeLoading
                                  }
                                >
                                  <div className="flex flex-col">
                                    <span>
                                      {rm.name} ({rm.code})
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Estoque: {rm.stockQuantity} unidades
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!hasStock && material && (
                            <p className="text-xs text-destructive mt-1">
                              Estoque insuficiente: {material.stockQuantity}{" "}
                              disponíveis
                            </p>
                          )}
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantityRequired}
                            onChange={(e) =>
                              updateCompositionItem(
                                index,
                                "quantityRequired",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            placeholder="Qtd"
                            disabled={isSubmitting || storeLoading}
                            className={!hasStock ? "border-destructive" : ""}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Unidades
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCompositionItem(index)}
                          className="text-destructive hover:text-destructive"
                          disabled={isSubmitting || storeLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {composition.length > 0 && (
                <div className="text-sm p-3 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-medium">Resumo da Composição:</p>
                      <p className="text-muted-foreground">
                        {composition.length} matéria
                        {composition.length !== 1 ? "s" : ""}-prima
                        {composition.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Quantidade Total:</p>
                      <p className="text-muted-foreground">
                        {composition.reduce(
                          (sum, item) => sum + item.quantityRequired,
                          0,
                        )}{" "}
                        unidades
                      </p>
                    </div>
                  </div>

                  {composition.some(
                    (item) =>
                      !hasEnoughStock(
                        item.rawMaterialId,
                        item.quantityRequired,
                      ),
                  ) && (
                    <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded">
                      <p className="text-xs text-destructive font-medium">
                        ⚠️ Atenção: Algumas matérias-primas têm estoque
                        insuficiente
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting || storeLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || storeLoading || composition.length === 0
                }
                className="min-w-[100px]"
              >
                {isSubmitting || storeLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {product ? "Salvando..." : "Criando..."}
                  </span>
                ) : product ? (
                  "Salvar Alterações"
                ) : (
                  "Criar Produto"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
