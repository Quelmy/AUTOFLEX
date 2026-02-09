import { useEffect, useState, useCallback } from "react";
import {
  Package,
  Boxes,
  TrendingUp,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/shared/StatCard";
import { useStore } from "@/store/useStore";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  productApi,
  rawMaterialApi,
  productionApi,
  healthApi,
} from "@/lib/api";

// Importar dados mock para fallback
import {
  mockProducts,
  mockRawMaterials,
  getMockSuggestions,
} from "@/lib/mockData";

// Cache para os dados do dashboard
let cachedDashboardData: {
  productsCount: number | string;
  rawMaterialsCount: number | string;
  totalProductionValue: number | string;
  totalProducts: number | string;
  hasData: boolean;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 30000; // 30 segundos

export default function Dashboard() {
  const {
    products,
    rawMaterials,
    productionSuggestions,
    fetchProducts,
    fetchRawMaterials,
    fetchProductionSuggestions,
    loading,
    error,
  } = useStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<
    "checking" | "online" | "offline" | "online-mock"
  >("checking");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastError, setLastError] = useState<string>("");
  const [hasCriticalError, setHasCriticalError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [connectionTestResults, setConnectionTestResults] = useState<any>({});
  const [useMockData, setUseMockData] = useState(false);
  const [mockSuggestions, setMockSuggestions] = useState<any[]>([]);

  // Gerar sugestões mock quando usar dados mock
  useEffect(() => {
    if (useMockData) {
      const suggestions = getMockSuggestions();
      setMockSuggestions(suggestions);
    }
  }, [useMockData]);

  // Testar conexão com API
  const testApiConnection = useCallback(async () => {
    console.log("🧪 Iniciando teste de conexão com API...");

    const results: any = {};

    try {
      // Teste 1: Health endpoint
      console.log("1. Testando health endpoint...");
      const health = await healthApi.check();
      results.health = {
        status: health.status === "UP" ? "success" : "error",
        message: health.message,
        details: health,
      };
      console.log("✅ Health:", health);
    } catch (error) {
      results.health = {
        status: "error",
        message: "Falha ao conectar",
        details: error,
      };
    }

    try {
      // Teste 2: Raw Materials
      console.log("2. Testando raw materials...");
      const rawResponse = await fetch("http://localhost:8080/raw-materials");
      results.rawMaterials = {
        status: rawResponse.ok ? "success" : "error",
        statusCode: rawResponse.status,
        message: rawResponse.ok ? "Conectado" : `Erro ${rawResponse.status}`,
        data: rawResponse.ok ? await rawResponse.json() : null,
      };
      console.log(`✅ Raw Materials: ${rawResponse.ok ? "OK" : "Erro"}`);
    } catch (error) {
      results.rawMaterials = {
        status: "error",
        message: "Falha na conexão",
        details: error,
      };
    }

    try {
      // Teste 3: Products
      console.log("3. Testando products...");
      const productsResponse = await fetch("http://localhost:8080/products");
      results.products = {
        status: productsResponse.ok ? "success" : "error",
        statusCode: productsResponse.status,
        message: productsResponse.ok
          ? "Conectado"
          : `Erro ${productsResponse.status}`,
        data: productsResponse.ok ? await productsResponse.json() : null,
      };
      console.log(`✅ Products: ${productsResponse.ok ? "OK" : "Erro"}`);
    } catch (error) {
      results.products = {
        status: "error",
        message: "Falha na conexão",
        details: error,
      };
    }

    setConnectionTestResults(results);
    return results;
  }, []);

  // Carregar dados iniciais e verificar API
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;

      try {
        await checkApiAndLoadData();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        if (mounted) {
          setHasCriticalError(true);
          setErrorDetails({
            message:
              error instanceof Error ? error.message : "Erro desconhecido",
            stack: error instanceof Error ? error.stack : undefined,
          });
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const checkApiAndLoadData = useCallback(async () => {
    setIsRefreshing(true);
    setApiStatus("checking");
    setLastError("");
    setHasCriticalError(false);

    console.log("🔄 Iniciando verificação da API Spring Boot...");

    try {
      // Testar conexão com API Spring Boot primeiro
      console.log("📡 Testando conexão com health endpoint...");

      const healthResponse = await fetch("http://localhost:8080/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log(
        "Status da resposta:",
        healthResponse.status,
        healthResponse.statusText,
      );

      if (!healthResponse.ok) {
        const errorText = await healthResponse.text();
        console.error(
          "❌ Health check falhou:",
          healthResponse.status,
          errorText,
        );
        setLastError(
          `HTTP ${healthResponse.status}: ${errorText || "Sem resposta"}`,
        );
        setApiStatus("offline");

        // Usar dados mock
        console.log("🛠️ Usando dados mock (API offline)");
        setUseMockData(true);
        setApiStatus("online-mock");
        return;
      }

      // Se chegou aqui, a API está online
      const healthData = await healthResponse.json();
      console.log("✅ Health check OK:", healthData);
      setApiStatus("online");
      setUseMockData(false);

      // Carregar dados reais - com tratamento individual de erro
      console.log("📥 Carregando dados do backend...");

      let successCount = 0;
      const totalRequests = 3;

      try {
        await fetchProducts();
        successCount++;
        console.log(`✅ Produtos carregados: ${products?.length || 0} itens`);
      } catch (productError: any) {
        console.error("❌ Erro ao carregar produtos:", productError);
        setLastError((prev) => prev + "Erro em produtos. ");
      }

      try {
        await fetchRawMaterials();
        successCount++;
        console.log(
          `✅ Matérias-primas carregadas: ${rawMaterials?.length || 0} itens`,
        );
      } catch (rawMaterialError: any) {
        console.error("❌ Erro ao carregar matérias-primas:", rawMaterialError);
        setLastError((prev) => prev + "Erro em matérias-primas. ");
      }

      try {
        await fetchProductionSuggestions();
        successCount++;
        console.log(
          `✅ Sugestões carregadas: ${productionSuggestions?.length || 0} itens`,
        );
      } catch (suggestionError: any) {
        console.error("❌ Erro ao carregar sugestões:", suggestionError);
        setLastError((prev) => prev + "Erro em sugestões. ");
      }

      console.log(
        `📊 ${successCount}/${totalRequests} carregamentos bem-sucedidos`,
      );

      // Se todos falharem ou não houver dados, usar mock como fallback
      if (successCount === 0) {
        console.log("⚠️ Nenhum dado carregado da API, usando dados mock");
        setUseMockData(true);
        setApiStatus("online-mock");
      }

      // Invalidar cache após carregar novos dados
      cachedDashboardData = null;
    } catch (error: any) {
      console.error("❌ Erro crítico ao conectar com API:", error);

      // Detectar tipo de erro
      const errorMessage = error.message || error.toString();
      setLastError(errorMessage);

      if (
        errorMessage.includes("CORS") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("Connection refused")
      ) {
        setLastError(
          "Erro de conexão: O Spring Boot pode não estar rodando ou há problema de CORS. Verifique se o backend está executando na porta 8080.",
        );
      }

      setApiStatus("offline");

      // Usar dados mock como fallback
      console.log("🛠️ Usando dados mock após erro de conexão");
      setUseMockData(true);
      setApiStatus("online-mock");
    } finally {
      setIsRefreshing(false);
      setIsInitialLoad(false);
      console.log("✅ Verificação concluída");
    }
  }, [
    fetchProducts,
    fetchRawMaterials,
    fetchProductionSuggestions,
    products?.length,
    rawMaterials?.length,
    productionSuggestions?.length,
  ]);

  // Calcular dados do dashboard com dados REAIS
  const getDashboardData = useCallback(() => {
    // Se estiver usando dados mock
    if (useMockData) {
      const suggestions = mockSuggestions || [];
      const totalProductionValue = suggestions.reduce(
        (acc, s) => acc + (s.totalValue || 0),
        0,
      );
      const totalProducts = suggestions.reduce(
        (acc, s) => acc + (s.maxQuantity || 0),
        0,
      );

      return {
        productsCount: mockProducts.length,
        rawMaterialsCount: mockRawMaterials.length,
        totalProductionValue,
        totalProducts,
        hasData: true,
        timestamp: Date.now(),
      };
    }

    // Se estiver em carregamento inicial, mostrar placeholder
    if (isInitialLoad && !cachedDashboardData) {
      return {
        productsCount: "-",
        rawMaterialsCount: "-",
        totalProductionValue: "-",
        totalProducts: "-",
        hasData: false,
      };
    }

    // Usar dados REAIS da API
    const suggestions = productionSuggestions || [];
    const totalProductionValue = suggestions.reduce(
      (acc, s) => acc + (s.totalValue || 0),
      0,
    );
    const totalProducts = suggestions.reduce(
      (acc, s) => acc + (s.maxQuantity || 0),
      0,
    );

    const data = {
      productsCount: products?.length || 0,
      rawMaterialsCount: rawMaterials?.length || 0,
      totalProductionValue,
      totalProducts,
      hasData: true,
      timestamp: Date.now(),
    };

    // Salvar no cache
    cachedDashboardData = data;

    return data;
  }, [
    apiStatus,
    loading,
    productionSuggestions,
    products,
    rawMaterials,
    isInitialLoad,
    useMockData,
    mockSuggestions,
  ]);

  const dashboardData = getDashboardData();

  const formatCurrency = useCallback((value: number | string) => {
    if (typeof value === "string") return value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  // Calcular materiais com estoque baixo
  const getCurrentRawMaterials = () => {
    return useMockData ? mockRawMaterials : rawMaterials || [];
  };

  const getCurrentProducts = () => {
    return useMockData ? mockProducts : products || [];
  };

  const getCurrentSuggestions = () => {
    return useMockData ? mockSuggestions : productionSuggestions || [];
  };

  const lowStockMaterials = getCurrentRawMaterials().filter((rm) => {
    return rm.stockQuantity <= 10;
  });
  const hasLowStock = lowStockMaterials.length > 0;

  // Verificar se temos dados para mostrar
  const hasRealData =
    !isInitialLoad &&
    ((useMockData && mockRawMaterials.length > 0) ||
      (!useMockData &&
        apiStatus === "online" &&
        !loading &&
        (rawMaterials?.length || 0) > 0));

  // Log para debug
  useEffect(() => {
    console.log("=== DASHBOARD DEBUG ===");
    console.log("API Status:", apiStatus);
    console.log("Using Mock Data:", useMockData);
    console.log("Loading:", loading);
    console.log("Raw Materials:", getCurrentRawMaterials().length, "itens");
    console.log("Products:", getCurrentProducts().length, "itens");
    console.log("Suggestions:", getCurrentSuggestions().length, "itens");
    console.log("Low Stock Materials:", lowStockMaterials.length);
    console.log("Dashboard Data:", dashboardData);
    console.log("=== FIM DEBUG ===");
  }, [
    apiStatus,
    loading,
    useMockData,
    mockSuggestions,
    dashboardData,
    lowStockMaterials.length,
  ]);

  // Se houver erro crítico, mostrar tela de erro
  if (hasCriticalError) {
    return (
      <MainLayout>
        <div className="p-8 text-center animate-fade-in">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            Erro Crítico no Dashboard
          </h2>
          <p className="text-muted-foreground mb-4">
            Ocorreu um erro ao renderizar o dashboard
          </p>
          <div className="max-w-2xl mx-auto">
            <pre className="mt-4 p-4 bg-gray-100 rounded text-left overflow-auto text-sm">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </div>
          <div className="mt-6 space-x-4">
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Recarregar Página
            </Button>
            <Button
              variant="outline"
              onClick={() => setHasCriticalError(false)}
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do seu estoque e produção
            </p>

            {/* Indicador de status da API */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {apiStatus === "checking" && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Conectando à API...
                </Badge>
              )}

              {apiStatus === "online" && (
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Conectado ao Spring Boot
                </Badge>
              )}

              {apiStatus === "online-mock" && (
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Usando dados de demonstração
                </Badge>
              )}

              {apiStatus === "offline" && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  API offline
                </Badge>
              )}

              {useMockData && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  <Package className="h-3 w-3 mr-1" />
                  Dados de demonstração
                </Badge>
              )}

              {hasLowStock && (
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {lowStockMaterials.length} item(s) com estoque baixo
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testApiConnection()}
              disabled={isRefreshing}
            >
              <Loader2
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Testar Conexão
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={checkApiAndLoadData}
              disabled={isRefreshing || loading}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Alertas de Erro */}
        {(error || lastError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar dados</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{error || lastError}</p>
                {apiStatus === "offline" && (
                  <p className="text-sm">
                    <strong>Solução:</strong> Verifique se o Spring Boot está
                    rodando executando{" "}
                    <code className="bg-gray-800 text-white px-2 py-1 rounded text-xs">
                      mvn spring-boot:run
                    </code>{" "}
                    no diretório do backend.
                  </p>
                )}
              </div>
            </AlertDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={checkApiAndLoadData}>
                Tentar novamente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.open("http://localhost:8080/health", "_blank");
                  window.open("http://localhost:8080/raw-materials", "_blank");
                }}
              >
                Testar endpoints
              </Button>
            </div>
          </Alert>
        )}

        {/* Resultados do teste de conexão */}
        {Object.keys(connectionTestResults).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Resultados do Teste de Conexão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(connectionTestResults).map(
                  ([key, result]: [string, any]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {result.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, " $1")}
                        </span>
                      </div>
                      <Badge
                        variant={
                          result.status === "success"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {result.message}
                      </Badge>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total de Produtos"
            value={dashboardData.productsCount}
            icon={Package}
            description={
              useMockData ? "Dados de demonstração" : "Produtos cadastrados"
            }
          />
          <StatCard
            title="Matérias-Primas"
            value={dashboardData.rawMaterialsCount}
            icon={Boxes}
            description={
              useMockData ? "Dados de demonstração" : "Itens em estoque"
            }
          />
          <StatCard
            title="Produção Possível"
            value={dashboardData.totalProducts}
            icon={TrendingUp}
            description="Unidades com estoque atual"
            variant="primary"
          />
          <StatCard
            title="Valor Potencial"
            value={
              dashboardData.hasData
                ? formatCurrency(dashboardData.totalProductionValue)
                : dashboardData.totalProductionValue
            }
            icon={DollarSign}
            description="Receita estimada"
            variant="accent"
          />
        </div>

        {/* Conteúdo principal */}
        {!isInitialLoad ? (
          <>
            {/* Tabs para diferentes visões */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="inventory">Estoque</TabsTrigger>
                <TabsTrigger value="production">Produção</TabsTrigger>
              </TabsList>

              {/* Tab: Visão Geral */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Produtos Recentes */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Produtos Recentes</CardTitle>
                          <CardDescription>
                            {useMockData
                              ? "Dados de demonstração"
                              : "Últimos produtos cadastrados"}
                          </CardDescription>
                        </div>
                        <Link to="/products">
                          <Button variant="ghost" size="sm">
                            Ver todos
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : getCurrentProducts().length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Nenhum produto cadastrado ainda.
                          </p>
                          <Link to="/products/new">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Cadastrar primeiro produto
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getCurrentProducts()
                            .slice(0, 5)
                            .map((product) => (
                              <div
                                key={product.id}
                                className="flex items-center justify-between rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium truncate">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {product.code}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="font-semibold text-primary ml-2 whitespace-nowrap">
                                  {formatCurrency(product.value)}
                                </p>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Alertas de Estoque */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Estoque de Matérias-Primas</CardTitle>
                          <CardDescription>
                            {hasLowStock ? (
                              <span className="text-yellow-600">
                                {lowStockMaterials.length} com estoque baixo
                              </span>
                            ) : useMockData ? (
                              "Dados de demonstração"
                            ) : (
                              "Status do estoque"
                            )}
                          </CardDescription>
                        </div>
                        <Link to="/raw-materials">
                          <Button variant="ghost" size="sm">
                            Ver todos
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : getCurrentRawMaterials().length === 0 ? (
                        <div className="text-center py-8">
                          <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Nenhuma matéria-prima cadastrada ainda.
                          </p>
                          <Link to="/raw-materials/new">
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                            >
                              Cadastrar primeira matéria-prima
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getCurrentRawMaterials()
                            .slice(0, 5)
                            .map((rm) => {
                              const stockLevel =
                                rm.stockQuantity <= 10
                                  ? "critical"
                                  : rm.stockQuantity <= 50
                                    ? "low"
                                    : "good";

                              const stockConfig = {
                                critical: {
                                  color:
                                    "bg-red-100 text-red-800 border-red-200",
                                  label: "Crítico",
                                  icon: "🔴",
                                },
                                low: {
                                  color:
                                    "bg-yellow-100 text-yellow-800 border-yellow-200",
                                  label: "Baixo",
                                  icon: "🟡",
                                },
                                good: {
                                  color:
                                    "bg-green-100 text-green-800 border-green-200",
                                  label: "Bom",
                                  icon: "🟢",
                                },
                              };

                              return (
                                <div
                                  key={rm.id}
                                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium truncate">
                                      {rm.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      Código: {rm.code}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 ml-2">
                                    <span
                                      className={`rounded-full px-2 py-1 text-xs font-medium ${stockConfig[stockLevel].color}`}
                                    >
                                      {stockConfig[stockLevel].icon}{" "}
                                      {stockConfig[stockLevel].label}
                                    </span>
                                    <span className="text-sm font-semibold">
                                      {rm.stockQuantity} un.
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                          {getCurrentRawMaterials().length > 5 && (
                            <div className="pt-2 text-center">
                              <p className="text-sm text-muted-foreground">
                                + {getCurrentRawMaterials().length - 5} outra
                                {getCurrentRawMaterials().length - 5 > 1
                                  ? "s"
                                  : ""}{" "}
                                matéria
                                {getCurrentRawMaterials().length - 5 > 1
                                  ? "s"
                                  : ""}
                                -prima
                                {getCurrentRawMaterials().length - 5 > 1
                                  ? "s"
                                  : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Estoque */}
              <TabsContent value="inventory" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Estoque</CardTitle>
                    <CardDescription>
                      {useMockData
                        ? "Dados de demonstração"
                        : "Visão detalhada do estoque atual"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {getCurrentRawMaterials().length === 0 ? (
                      <div className="text-center py-8">
                        <Boxes className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          Nenhuma matéria-prima cadastrada ainda.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="font-medium">
                              Distribuição de Estoque
                            </h4>
                            {getCurrentRawMaterials().map((rm) => {
                              // Calcular cor baseada no nível de estoque
                              const getProgressColor = () => {
                                if (rm.stockQuantity <= 10) return "bg-red-500";
                                if (rm.stockQuantity <= 50)
                                  return "bg-yellow-500";
                                return "bg-green-500";
                              };

                              return (
                                <div key={rm.id} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>{rm.name}</span>
                                    <span className="font-medium">
                                      {rm.stockQuantity} un.
                                    </span>
                                  </div>
                                  <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className={`absolute top-0 left-0 h-full ${getProgressColor()}`}
                                      style={{
                                        width: `${Math.min(rm.stockQuantity, 100)}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Resumo</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg border p-3 text-center">
                                  <div className="text-2xl font-bold text-green-600">
                                    {
                                      getCurrentRawMaterials().filter(
                                        (rm) => rm.stockQuantity > 50,
                                      ).length
                                    }
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Estoque Bom
                                  </div>
                                </div>
                                <div className="rounded-lg border p-3 text-center">
                                  <div className="text-2xl font-bold text-red-600">
                                    {lowStockMaterials.length}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Estoque Crítico
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <h4 className="font-medium mb-2">
                                Ações Rápidas
                              </h4>
                              <div className="space-y-2">
                                <Link to="/raw-materials/new">
                                  <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                  >
                                    <Boxes className="mr-2 h-4 w-4" />
                                    Adicionar Matéria-Prima
                                  </Button>
                                </Link>
                                {hasLowStock && (
                                  <Link to="/raw-materials">
                                    <Button
                                      variant="destructive"
                                      className="w-full justify-start"
                                    >
                                      <AlertCircle className="mr-2 h-4 w-4" />
                                      Reabastecer Estoque Baixo
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Produção */}
              <TabsContent value="production" className="space-y-6">
                {getCurrentSuggestions().length > 0 ? (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <CardTitle>Sugestões de Produção</CardTitle>
                          <CardDescription>
                            {useMockData
                              ? "Dados de demonstração"
                              : "Baseado no estoque atual, priorizando maior valor"}
                          </CardDescription>
                        </div>
                        <Link to="/production">
                          <Button>
                            Ver detalhes completos
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {getCurrentSuggestions()
                          .slice(0, 3)
                          .map((suggestion) => {
                            if (!suggestion || !suggestion.product) return null;

                            return (
                              <Card
                                key={suggestion.product.id}
                                className="overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
                              >
                                <div className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h3 className="font-semibold">
                                        {suggestion.product.name}
                                      </h3>
                                      <Badge
                                        variant="outline"
                                        className="mt-1 text-xs"
                                      >
                                        {suggestion.product.code}
                                      </Badge>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-accent">
                                        {formatCurrency(suggestion.totalValue)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        Quantidade:
                                      </span>
                                      <span className="font-semibold text-primary">
                                        {suggestion.maxQuantity} un.
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        Valor unitário:
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(
                                          suggestion.product.value,
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">
                                        Valor total:
                                      </span>
                                      <span className="font-medium">
                                        {formatCurrency(suggestion.totalValue)}
                                      </span>
                                    </div>
                                  </div>

                                  <Link
                                    to={`/production?product=${suggestion.product.id}`}
                                  >
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="w-full mt-4"
                                    >
                                      <TrendingUp className="mr-2 h-4 w-4" />
                                      Produzir {suggestion.maxQuantity} unidades
                                    </Button>
                                  </Link>
                                </div>
                              </Card>
                            );
                          })}
                      </div>

                      {getCurrentSuggestions().length > 3 && (
                        <div className="mt-4 text-center">
                          <p className="text-sm text-muted-foreground">
                            + {getCurrentSuggestions().length - 3} outra
                            {getCurrentSuggestions().length - 3 > 1
                              ? "s"
                              : ""}{" "}
                            sugestão
                            {getCurrentSuggestions().length - 3 > 1
                              ? "ões"
                              : ""}{" "}
                            disponível
                            {getCurrentSuggestions().length - 3 > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sugestão de Produção</CardTitle>
                      <CardDescription>
                        Não há produção possível com o estoque atual
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">
                          Estoque insuficiente para produção
                        </h3>
                        <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                          Cadastre produtos e associe matérias-primas para ver
                          sugestões de produção.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                          <Link to="/products/new">
                            <Button variant="outline">Cadastrar Produto</Button>
                          </Link>
                          <Link to="/raw-materials/new">
                            <Button variant="outline">
                              Cadastrar Matéria-Prima
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          // Loading State durante o carregamento inicial
          <div className="grid gap-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    </div>
                    <div className="mt-4">
                      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                      <div className="mt-2 h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="h-16 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem se API offline sem cache */}
        {apiStatus === "offline" && !useMockData && !isInitialLoad && (
          <Card>
            <CardHeader>
              <CardTitle>Spring Boot Backend Offline</CardTitle>
              <CardDescription>
                O sistema não pode carregar dados sem conexão com a API Spring
                Boot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-4 text-lg font-semibold">
                  {lastError
                    ? `Erro: ${lastError}`
                    : "Verificação de conexão com API falhou"}
                </h3>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                  Verifique se o Spring Boot está rodando e tente:
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-md font-mono text-sm text-left space-y-2">
                  <div>1. Verifique se o Spring Boot está rodando:</div>
                  <code className="block p-2 bg-gray-200 rounded">
                    cd backend-autoflex && mvn spring-boot:run
                  </code>
                  <div>2. Teste a conexão manualmente:</div>
                  <a
                    href="http://localhost:8080/health"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    http://localhost:8080/health
                  </a>
                  <div>3. Teste os endpoints:</div>
                  <div className="space-y-1">
                    <a
                      href="http://localhost:8080/raw-materials"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      http://localhost:8080/raw-materials
                    </a>
                    <a
                      href="http://localhost:8080/products"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-green-100 text-green-800 rounded hover:bg-green-200"
                    >
                      http://localhost:8080/products
                    </a>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={checkApiAndLoadData}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Tentar conectar novamente
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      setUseMockData(true);
                      setApiStatus("online-mock");
                    }}
                  >
                    Usar dados de demonstração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rodapé informativo */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          <p>
            Sistema de Gestão de Produção •{" "}
            {useMockData
              ? "Modo de demonstração - Dados locais"
              : apiStatus === "online"
                ? "Conectado ao Spring Boot"
                : apiStatus === "online-mock"
                  ? "Usando dados de demonstração"
                  : "Aguardando conexão com o backend"}
          </p>
          <p className="mt-1">
            Backend Spring Boot:{" "}
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              http://localhost:8080
            </a>
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
