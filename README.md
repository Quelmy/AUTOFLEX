# Autoflex Inventory Planner - Teste Prático

## Descrição do Projeto

Sistema completo para controle de produção industrial que gerencia estoque de matérias-primas, produtos e calcula produção otimizada baseada em disponibilidade de insumos.

## Objetivo

Desenvolver um sistema WEB que:

- Controla estoque de matérias-primas
- Gerencia produtos e suas composições
- Sugere produção otimizada baseada em estoque atual
- Prioriza produtos de maior valor

## Tecnologias Utilizadas

### Backend (API REST)

- **Java 17** + **Spring Boot 3.2.2**
- **Spring Data JPA** para persistência
- **PostgreSQL 15** (com Docker)
- **Maven** para gerenciamento de dependências

### Frontend (Interface WEB)

- **React 18** + **TypeScript 5**
- **Vite** para build e dev server
- **Tailwind CSS** para estilização
- **Shadcn/ui** para componentes
- **React Router DOM** para navegação
- **Zustand** para gerenciamento de estado

## Requisitos Atendidos

### Requisitos Não Funcionais

- **RNF001** - Plataforma WEB compatível com Chrome, Firefox, Edge
- **RNF002** - Arquitetura API (Backend Spring Boot + Frontend React)
- **RNF003** - Telas responsivas com Tailwind CSS
- **RNF004** - Persistência em PostgreSQL
- **RNF005** - Backend com Spring Boot
- **RNF006** - Frontend com React + TypeScript
- **RNF007** - Código em inglês (tables, columns, variables)

### Requisitos Funcionais

- **RF001** - CRUD completo de produtos (Backend)
- **RF002** - CRUD completo de matérias-primas (Backend)
- **RF003** - Associação produtos-matérias (Backend)
- **RF004** - Consulta de produção possível (Backend)
- **RF005** - Interface CRUD de produtos (Frontend)
- **RF006** - Interface CRUD de matérias-primas (Frontend)
- **RF007** - Interface para associar matérias aos produtos (Frontend)
- **RF008** - Interface para sugestões de produção (Frontend)

## Como Executar

### Pré-requisitos

```bash
# Ferramentas necessárias
- Java 17 ou superior
- Maven 3.8+
- Node.js 18+
- Docker (opcional, mas recomendado)
- PostgreSQL 15+ (ou usar Docker)
```

## Configuração do Banco de Dados

### Opção A: Usando Docker (Recomendado)

```bash
# 1. Criar container PostgreSQL
docker run --name autoflex-db \
  -e POSTGRES_DB=inventory_planner \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=admin123 \
  -p 5432:5432 \
  -d postgres:15-alpine

# 2. Executar script de criação
docker exec -i autoflex-db psql -U admin inventory_planner < database-schema.sql

# Opção B: Instalação manual
# Crie database: inventory_planner
# Usuário: admin | Senha: admin123
```

### 2. Backend (Spring Boot)

```bash
cd backend-autoflex

# Configurar banco (se necessário, editar application.properties)
# spring.datasource.url=jdbc:postgresql://localhost:5432/inventory_planner
# spring.datasource.username=admin
# spring.datasource.password=admin123

# Compilar e executar
mvn clean install
mvn spring-boot:run

# API estará disponível em: http://localhost:8080
```

### 3. Frontend (React)

```bash
cd frontend-autoflex

# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Aplicação estará disponível em: http://localhost:5173
```

### Teste Rápido

```bash
# Testar API
curl http://localhost:8080/health
curl http://localhost:8080/products
curl http://localhost:8080/raw-materials
curl http://localhost:8080/production/suggestions
```

## Estrutura do Projeto

### Backend (`backend-autoflex/`)

```
src/main/java/com/autoflex/
├── config/              # Configurações (CORS, etc.)
├── controller/          # Controladores REST
│   ├── ProductController.java
│   ├── RawMaterialController.java
│   └── ProductionController.java
├── model/              # Entidades JPA
│   ├── Product.java
│   ├── RawMaterial.java
│   └── ProductMaterial.java
├── repository/         # Interfaces Spring Data JPA
│   ├── ProductRepository.java
│   ├── RawMaterialRepository.java
│   └── ProductMaterialRepository.java
├── service/           # Lógica de negócio
│   ├── ProductService.java
│   ├── RawMaterialService.java
│   └── ProductionService.java
└── BackendAutoflexApplication.java
```

### Frontend (`frontend-autoflex/`)

```
src/
├── components/         # Componentes React
│   ├── ui/            # Componentes Shadcn/ui
│   ├── layout/        # Layouts da aplicação
│   └── shared/        # Componentes compartilhados
├── pages/             # Páginas da aplicação
│   ├── Dashboard.tsx  # Dashboard principal
│   ├── Products.tsx   # Gerenciamento de produtos
│   ├── RawMaterials.tsx # Gerenciamento de matérias-primas
│   └── Production.tsx # Sugestões de produção
├── store/             # Gerenciamento de estado (Zustand)
├── lib/               # APIs e utilitários
├── types/             # Tipos TypeScript
└── App.tsx            # Componente principal
```

## Funcionalidades Implementadas

### 1. Dashboard Interativo

- Status da API em tempo real
- Métricas de produtos e matérias-primas
- Alertas de estoque baixo
- Tabs para diferentes visões (Geral, Estoque, Produção)

### 2. Gestão de Produtos

- CRUD completo
- Associação com matérias-primas
- Cálculo automático de valor

### 3. Gestão de Matérias-Primas

- Controle de estoque
- Atualização de quantidades
- Alertas visuais para estoque crítico

### 4. Sugestões de Produção

- Algoritmo que calcula produção máxima
- Ordenação por maior valor total
- Interface para executar produção
- Fallback para dados mock quando backend offline

### 5. Responsividade

- Layout adaptável para mobile e desktop
- Componentes otimizados para diferentes telas

## Características Técnicas

### Backend

- **API RESTful** com endpoints documentados
- **Spring Data JPA** para ORM
- **PostgreSQL** com migrations automáticas
- **Tratamento de CORS** configurado
- **Logging** detalhado para debug

### Frontend

- **TypeScript** para tipagem estática
- **Hooks React** modernos (useState, useEffect, useCallback)
- **Gerenciamento de estado** com Zustand
- **Requisições HTTP** com Fetch API
- **Error handling** robusto
- **Loading states** com skeletons

### Otimizações

- **Cache** de dados no frontend
- **Fallback automático** para dados mock
- **Testes de conexão** com API
- **Logs de debug** no console

## Algoritmo de Sugestão de Produção

O sistema implementa o seguinte algoritmo:

```typescript
1. Para cada produto:
   - Calcular quanto pode ser produzido baseado em cada matéria-prima
   - Encontrar o fator limitante (matéria-prima mais crítica)
   - Calcular quantidade máxima possível
   - Calcular valor total (quantidade × valor unitário)

2. Ordenar produtos por:
   - Maior valor total primeiro (priorização por valor)

3. Retornar sugestões com:
   - Produto
   - Quantidade máxima possível
   - Valor total estimado
   - Detalhes das matérias-primas limitantes
```

## Testes

### Testes de API

```bash
# Health Check
curl http://localhost:8080/health

# Testar endpoints principais
curl http://localhost:8080/products
curl http://localhost:8080/raw-materials
curl http://localhost:8080/production/suggestions
```

### Modo de Demonstração

Caso o backend não esteja disponível, o frontend automaticamente:

1. Detecta que a API está offline
2. Usa dados mock para demonstração
3. Mostra indicador visual "Modo de demonstração"
4. Permite testar todas as funcionalidades

## Solução de Problemas Comuns

### Backend não inicia

```bash
# Liberar porta 8080
sudo kill -9 $(sudo lsof -ti:8080)

# Verificar PostgreSQL
docker ps | grep postgres

# Ver logs
cd backend-autoflex && mvn spring-boot:run
```

### Frontend não conecta

1. Verifique se backend está rodando: `curl http://localhost:8080/health`
2. Clique em "Testar Conexão" no dashboard
3. Use "Dados de demonstração" se necessário

### Erros de CORS

- Backend já inclui configuração CORS
- Verifique se está rodando na porta 8080

## Compatibilidade

- Chrome (últimas versões)
- Firefox (últimas versões)
- Edge (últimas versões)
- Mobile (responsive design)

## Fluxo de Trabalho Desenvolvido

1. Modelagem do banco de dados
2. Desenvolvimento da API Spring Boot
3. Implementação dos endpoints REST
4. Desenvolvimento do frontend React
5. Integração frontend-backend
6. Testes e validações
7. Documentação

## Diferenciais Implementados

1. **Modo offline** com dados mock
2. **Dashboard interativo** com métricas em tempo real
3. **UI/UX moderna** com Tailwind CSS e Shadcn/ui
4. **Responsividade completa**
5. **Tratamento de erros** robusto
6. **Logs de debug** para desenvolvimento
7. **Cache inteligente** de dados
8. **Testes de conexão** automáticos

## Decisões de Design

### Arquitetura

- **Separação clara** entre frontend e backend
- **API RESTful** bem definida
- **Components reutilizáveis** no frontend

### Banco de Dados

- **PostgreSQL** pela robustez e performance
- **Relacionamentos** apropriados (OneToMany, ManyToOne)
- **Índices** para performance de queries

### Frontend

- **TypeScript** para maior segurança no código
- **Componentes funcionais** com Hooks
- **Gerenciamento de estado** centralizado

## 👨‍💻 Autor

Riquelmy

- Desenvolvimento Full Stack
- Arquitetura e implementação completa
- Documentação e testes

---

**Nota**: Este projeto foi desenvolvido como teste técnico para a vaga na Autoflex, demonstrando habilidades em Spring Boot, React, TypeScript, PostgreSQL e desenvolvimento de sistemas completos.
