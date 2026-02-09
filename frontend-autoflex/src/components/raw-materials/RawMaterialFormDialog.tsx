// @/components/raw-materials/RawMaterialStockDialog.tsx
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RawMaterial } from "@/types";
import { useStore } from "@/store/useStore";
import { ArrowUp, ArrowDown } from "lucide-react";

const stockAdjustmentSchema = z.object({
  adjustmentType: z.enum(["increase", "decrease"]),
  quantity: z.number().min(1, "Quantidade deve ser maior que zero"),
  reason: z.string().optional(),
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface RawMaterialStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawMaterial: RawMaterial;
  onSuccess?: () => void;
}

export function RawMaterialStockDialog({
  open,
  onOpenChange,
  rawMaterial,
  onSuccess,
}: RawMaterialStockDialogProps) {
  const { updateRawMaterial, fetchRawMaterials, loading } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustmentType: "increase",
      quantity: 1,
      reason: "",
    },
  });

  const adjustmentType = form.watch("adjustmentType");
  const quantity = form.watch("quantity");

  const calculateNewStock = () => {
    if (adjustmentType === "increase") {
      return rawMaterial.stockQuantity + quantity;
    } else {
      const newStock = rawMaterial.stockQuantity - quantity;
      return newStock < 0 ? 0 : newStock;
    }
  };

  const handleSubmit = async (data: StockAdjustmentData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newStockQuantity = calculateNewStock();

      // Verificar se há estoque suficiente para diminuição
      if (data.adjustmentType === "decrease" && newStockQuantity < 0) {
        throw new Error("Quantidade insuficiente em estoque");
      }

      await updateRawMaterial(rawMaterial.id, {
        stockQuantity: newStockQuantity,
      });

      // Recarregar dados
      await fetchRawMaterials();

      // Fechar dialog e limpar
      onOpenChange(false);
      form.reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error adjusting stock:", error);
      setError(error.message || "Erro ao ajustar estoque");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            {rawMaterial.name} ({rawMaterial.code})
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Informações atuais */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm text-muted-foreground">
                Estoque Atual
              </Label>
              <p className="text-2xl font-bold">{rawMaterial.stockQuantity}</p>
              <p className="text-xs text-muted-foreground">unidades</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Novo Estoque
              </Label>
              <p className="text-2xl font-bold">{calculateNewStock()}</p>
              <p className="text-xs text-muted-foreground">após ajuste</p>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="adjustmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ajuste</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isSubmitting || loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">
                          <div className="flex items-center gap-2">
                            <ArrowUp className="h-4 w-4 text-green-600" />
                            <span>Adicionar ao Estoque</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="decrease">
                          <div className="flex items-center gap-2">
                            <ArrowDown className="h-4 w-4 text-red-600" />
                            <span>Retirar do Estoque</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Quantidade"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                        disabled={isSubmitting || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Compra, Produção, Ajuste..."
                        {...field}
                        disabled={isSubmitting || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Validação de estoque insuficiente */}
              {adjustmentType === "decrease" &&
                quantity > rawMaterial.stockQuantity && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm font-medium text-red-800">
                      ⚠️ Estoque Insuficiente
                    </p>
                    <p className="text-sm text-red-700">
                      Não é possível retirar {quantity} unidades. Estoque
                      disponível: {rawMaterial.stockQuantity} unidades.
                    </p>
                  </div>
                )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting || loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    loading ||
                    (adjustmentType === "decrease" &&
                      quantity > rawMaterial.stockQuantity)
                  }
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Ajustando...
                    </span>
                  ) : (
                    "Confirmar Ajuste"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
