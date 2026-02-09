import React, { memo } from "react";
import { ProductionSuggestion } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

interface ProductionSuggestionsListProps {
  suggestions: ProductionSuggestion[];
  onExecuteProduction: (
    productId: string,
    quantity: number,
    productName: string,
  ) => void;
  isExecuting: string | null;
  rawMaterials: any[];
  formatCurrency: (value: number) => string;
}

export const ProductionSuggestionsList = memo(
  function ProductionSuggestionsList({
    suggestions,
    onExecuteProduction,
    isExecuting,
    rawMaterials,
    formatCurrency,
  }: ProductionSuggestionsListProps) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Detalhamento da Produção</h2>
        <div className="grid gap-4">
          {suggestions.map((suggestion, index) => {
            const composition = suggestion.product.productMaterials || [];

            return (
              <div
                key={`suggestion-${suggestion.product.id}`}
                className="opacity-100" // Forçar opacity para evitar transições problemáticas
              >
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      {/* Product Info */}
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                          {index + 1}º
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">
                              {suggestion.product.name}
                            </CardTitle>
                            <Badge variant="outline">
                              {suggestion.product.code}
                            </Badge>
                          </div>
                          <CardDescription className="mt-1">
                            Valor unitário:{" "}
                            {formatCurrency(suggestion.product.value)}
                          </CardDescription>
                        </div>
                      </div>

                      {/* Production Stats & Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {suggestion.maxQuantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Unidades
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-accent">
                              {formatCurrency(suggestion.totalValue)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Valor Total
                            </p>
                          </div>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onExecuteProduction(
                              suggestion.product.id,
                              suggestion.maxQuantity,
                              suggestion.product.name,
                            );
                          }}
                          disabled={
                            isExecuting === suggestion.product.id ||
                            suggestion.maxQuantity <= 0
                          }
                          className="w-full sm:w-auto"
                        >
                          {isExecuting === suggestion.product.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Produzir {suggestion.maxQuantity} un.
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Composition Details */}
                    {composition.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Matérias-primas necessárias para{" "}
                          {suggestion.maxQuantity} unidades:
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {composition.map((comp: any, compIndex: number) => {
                            const rawMaterialId =
                              comp.rawMaterialId || comp.rawMaterial?.id;
                            const quantityRequired = comp.requiredQuantity || 0;
                            const totalNeeded =
                              quantityRequired * suggestion.maxQuantity;

                            const rawMaterial = rawMaterials.find(
                              (rm) => rm.id === rawMaterialId,
                            );
                            const currentStock =
                              rawMaterial?.stockQuantity || 0;
                            const isEnoughStock = currentStock >= totalNeeded;

                            return (
                              <div
                                key={`composition-${suggestion.product.id}-${compIndex}`}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                                  isEnoughStock
                                    ? "bg-muted/50"
                                    : "bg-red-50 border border-red-200"
                                }`}
                              >
                                <div>
                                  <span className="text-sm font-medium">
                                    {rawMaterial?.name ||
                                      comp.rawMaterial?.name ||
                                      "Material desconhecido"}
                                  </span>
                                  <p className="text-xs text-muted-foreground">
                                    {quantityRequired} un. por produto
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={`text-sm font-semibold ${
                                      isEnoughStock
                                        ? "text-primary"
                                        : "text-red-600"
                                    }`}
                                  >
                                    {totalNeeded}
                                  </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                    / {currentStock} em estoque
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
