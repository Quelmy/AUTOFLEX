import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useStore } from "@/store/useStore";
import {
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductionSuggestion } from "@/types";

export default function Production() {
  const {
    productionSuggestions,
    fetchProductionSuggestions,
    executeProduction,
    rawMaterials,
    loading,
    error,
  } = useStore();

  const [isExecuting, setIsExecuting] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [localSuggestions, setLocalSuggestions] = useState<
    ProductionSuggestion[]
  >([]);

  useEffect(() => {
    if (productionSuggestions) {
      setLocalSuggestions(productionSuggestions);
    }
  }, [productionSuggestions]);

  const suggestions = localSuggestions;
  const totalValue = suggestions.reduce((acc, s) => acc + s.totalValue, 0);
  const totalUnits = suggestions.reduce((acc, s) => acc + s.maxQuantity, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handleExecuteProduction = useCallback(
    async (productId: string, quantity: number, productName: string) => {
      if (!productId || !quantity || quantity <= 0) return;

      setIsExecuting(productId);
      setExecutionResult(null);

      try {
        console.log("Executando produção:", {
          productId,
          quantity,
          productName,
        });

        const result = await executeProduction(productId, quantity);
        console.log("Resultado da produção:", result);

        setExecutionResult({
          success: result.success || true,
          message:
            result.message ||
            `Produção de ${quantity} unidade(s) de ${productName} realizada com sucesso!`,
        });

        // Atualizar localmente as sugestões (otimista)
        setLocalSuggestions((prev) => {
          return prev
            .map((suggestion) => {
              if (suggestion.product.id === productId) {
                const newMaxQuantity = Math.max(
                  0,
                  suggestion.maxQuantity - quantity,
                );
                return {
                  ...suggestion,
                  maxQuantity: newMaxQuantity,
                  totalValue: suggestion.product.value * newMaxQuantity,
                };
              }
              return suggestion;
            })
            .filter((s) => s.maxQuantity > 0)
            .sort((a, b) => b.totalValue - a.totalValue);
        });

        // Recarregar do servidor após um delay
        setTimeout(() => {
          fetchProductionSuggestions();
        }, 1500);
      } catch (error: any) {
        console.error("Erro na produção:", error);
        setExecutionResult({
          success: false,
          message: error.message || "Erro ao executar produção",
        });
      } finally {
        // Delay para evitar transições muito rápidas
        setTimeout(() => {
          setIsExecuting(null);
        }, 300);
      }
    },
    [executeProduction, fetchProductionSuggestions],
  );

  const handleRefresh = useCallback(() => {
    setExecutionResult(null);
    fetchProductionSuggestions();
  }, [fetchProductionSuggestions]);

  
  const renderComposition = (suggestion: ProductionSuggestion) => {
    try {
      // Extrair composition do productMaterials
      const productMaterials = suggestion.product.productMaterials || [];

      if (!productMaterials.length) return null;

      return productMaterials.map((pm: any, index: number) => {

        const rawMaterial = pm.rawMaterial || {};
        const rawMaterialId = rawMaterial.id || pm.rawMaterialId;
        const quantityRequired = pm.requiredQuantity || 0;
        const totalNeeded = quantityRequired * suggestion.maxQuantity;

        const currentStock = rawMaterial.stockQuantity || 0;
        const isEnoughStock = currentStock >= totalNeeded;

        return (
          <div
            key={`${suggestion.product.id}-${index}`}
            className={`flex items-center justify-between rounded-lg px-3 py-2 ${
              isEnoughStock ? "bg-muted/50" : "bg-red-50 border border-red-200"
            }`}
          >
            <div>
              <span className="text-sm font-medium">
                {rawMaterial.name || "Material desconhecido"}
              </span>
              <p className="text-xs text-muted-foreground">
                {quantityRequired} un. por produto
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-sm font-semibold ${
                  isEnoughStock ? "text-primary" : "text-red-600"
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
      });
    } catch (err) {
      console.error("Erro ao renderizar composição:", err);
      return null;
    }
  };

  // Se houver erro crítico, mostrar mensagem simples
  if (error && suggestions.length === 0) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500" />
          <h2 className="mt-4 text-2xl font-bold">Erro ao carregar</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Button className="mt-6" onClick={handleRefresh}>
            Tentar novamente
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Sugestão de Produção
            </h1>
            <p className="text-muted-foreground mt-1">
              Produtos que podem ser fabricados com o estoque atual
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Atualizar
          </Button>
        </div>

        {/* Result Message */}
        {executionResult && (
          <Card
            className={`mb-4 ${executionResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <CardContent className="p-4 flex items-center gap-3">
              {executionResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <div>
                <p
                  className={`font-medium ${executionResult.success ? "text-green-800" : "text-red-800"}`}
                >
                  {executionResult.success ? "Sucesso!" : "Erro!"}
                </p>
                <p
                  className={`text-sm ${executionResult.success ? "text-green-700" : "text-red-700"}`}
                >
                  {executionResult.message}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            title="Produtos Sugeridos"
            value={loading ? "-" : suggestions.length}
            icon={Package}
            description="Diferentes produtos"
          />
          <StatCard
            title="Total de Unidades"
            value={loading ? "-" : totalUnits}
            icon={TrendingUp}
            description="Podem ser produzidas"
            variant="primary"
          />
          <StatCard
            title="Valor Total Estimado"
            value={loading ? "-" : formatCurrency(totalValue)}
            icon={DollarSign}
            description="Receita potencial"
            variant="accent"
          />
        </div>

        {/* Loading State */}
        {loading && suggestions.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
            <h3 className="mt-4 text-lg font-semibold">
              Calculando sugestões de produção...
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Analisando estoque e produtos para otimizar a produção.
            </p>
          </div>
        )}

        {/* Suggestions List */}
        {!loading && suggestions.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Nenhuma produção possível
            </h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              Não há estoque suficiente de matérias-primas para produzir nenhum
              produto. Verifique os cadastros de produtos e matérias-primas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Detalhamento da Produção</h2>
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <Card
                  key={`suggestion-${suggestion.product.id}-${index}`}
                  className="transition-all hover:shadow-md"
                >
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
                            handleExecuteProduction(
                              suggestion.product.id,
                              suggestion.maxQuantity,
                              suggestion.product.name,
                            );
                          }}
                          disabled={
                            isExecuting === suggestion.product.id ||
                            loading ||
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
                    {/* Composition Details  */}
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium text-muted-foreground mb-3">
                        Matérias-primas necessárias para{" "}
                        {suggestion.maxQuantity} unidades:
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {renderComposition(suggestion)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
