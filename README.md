# CifraCash

**Sua vida financeira em uma única plataforma.** Sistema completo de gestão financeira pessoal com dashboard inteligente, controle de investimentos, cartões de crédito e metas.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

<p align="center">
  <a href="https://cifracash.vercel.app">Acessar App</a> •
  <a href="https://cifracash.vercel.app/docs">Documentacao API</a>
</p>

---

## Diferenciais

| | |
|---|---|
| **Patrimonio Consolidado** | Visualize tudo em um so lugar: saldo, investimentos, metas e dividas |
| **Score de Saude Financeira** | Avaliacao inteligente baseada em 4 pilares: liquidez, poupanca, divida e diversificacao |
| **Multi-moeda** | Suporte a Real (BRL), Dolar (USD) e Euro (EUR) com conversao automatica |
| **Modo Discreto** | Oculte valores sensiveis com um clique, protegido por PIN |
| **100% Responsivo** | Interface otimizada para desktop e mobile com bottom tabs |
| **Tema Claro/Escuro** | Personalize a aparencia com transicao suave |
| **Cotacoes em Tempo Real** | Integracao com BRAPI para acoes, FIIs e ETFs brasileiros |
| **Internacionalizacao** | Interface disponivel em Portugues, Ingles e Espanhol |

---

## Funcionalidades

### Dashboard Inteligente
- Resumo financeiro do mes (receitas, despesas, saldo)
- Grafico de evolucao financeira (1 semana a 1 ano)
- Grafico de despesas por categoria
- **Evolucao patrimonial consolidada** - transacoes + investimentos + metas - dividas
- **Score de saude financeira** com metricas detalhadas
- Calendario financeiro e estatisticas rapidas

### Transacoes
- Registro de receitas e despesas com categorias personalizaveis
- Filtros avancados (periodo, tipo, categoria, faixa de valor)
- Busca por descricao
- **Templates/Atalhos** para transacoes frequentes
- Botoes de acao rapida (FAB)
- Importacao/Exportacao (JSON, CSV, XLSX)

### Investimentos
- **Renda Variavel:** Acoes, FIIs, ETFs, Criptomoedas
- **Renda Fixa:** CDBs, Tesouro Direto, LCI/LCA, Poupanca
- Historico de operacoes (compra, venda, deposito, resgate)
- Registro de dividendos e proventos
- Calculo automatico de rentabilidade
- Grafico de alocacao por tipo de ativo
- **Cotacoes em tempo real** via BRAPI

### Cartoes de Credito
- Cadastro de multiplos cartoes com cores personalizadas
- Controle de faturas mensais (aberta, fechada, paga, vencida)
- Registro de compras a vista e **parceladas**
- Acompanhamento de limite disponivel
- **Analytics** de gastos por categoria
- Previsao de faturas futuras
- Alertas de vencimento e uso alto do limite

### Orcamentos
- Definicao de limites por categoria
- Acompanhamento visual de gastos vs. orcamento
- Orcamentos fixos ou mensais
- Alertas de consumo

### Despesas Recorrentes
- Cadastro de contas fixas mensais
- Lancamento automatico como transacao
- Controle de vencimentos e status de pagamento

### Metas Financeiras
- Tipos: Emergencia, Viagem, Carro, Casa, Educacao, Aposentadoria, Outro
- Registro de contribuicoes/aportes
- Acompanhamento visual de progresso
- Calculo de valor mensal necessario

### Relatorios e Analytics
- Padroes de gastos por dia da semana
- Tendencias de categorias (ultimos 6 meses)
- Velocidade de gastos com projecao mensal
- Comparativo ano atual vs. anterior
- **Insights automaticos**
- Exportacao em PDF

### Seguranca e Privacidade
- Autenticacao com email e senha
- Recuperacao de senha por email
- **Modo discreto** com verificacao por PIN
- Rate limiting em todas as APIs

---

## Stack Tecnologica

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19, TailwindCSS 4, Radix UI |
| Banco de Dados | PostgreSQL (Supabase) + Prisma 6 |
| Autenticacao | NextAuth.js v5 (Auth.js) |
| Estado | Zustand 5 + React Context |
| Graficos | Recharts 3 |
| Formularios | React Hook Form + Zod 4 |
| Icones | Lucide React |
| Email | Resend + Nodemailer |
| Testes | Vitest + Testing Library |
| Documentacao | OpenAPI 3.0 + Swagger UI |
| i18n | next-intl |

---

## Instalacao Local

### Pre-requisitos
- Node.js 18+
- PostgreSQL 14+ (ou conta Supabase)

### Passos

```bash
# Clone o repositorio
git clone https://github.com/peandrade/cifracash.git
cd cifracash

# Instale as dependencias
npm install

# Configure as variaveis de ambiente
cp .env.example .env
```

Edite o `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:6543/db?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/db"
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"
BRAPI_API_KEY="sua-api-key"
RESEND_API_KEY="sua-api-key"
```

```bash
# Configure o banco de dados
npx prisma generate
npx prisma db push

# (Opcional) Popule com dados de exemplo
npm run db:seed

# Inicie o servidor
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Scripts

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm test` | Testes em modo watch |
| `npm run test:coverage` | Testes com cobertura |
| `npm run db:seed` | Popular banco com exemplos |
| `npm run db:studio` | Abrir Prisma Studio |

---

## Documentacao da API

A API possui documentacao interativa completa usando **OpenAPI 3.0** e **Swagger UI**.

| | URL |
|---|---|
| **App** | [cifracash.vercel.app](https://cifracash.vercel.app) |
| **Documentacao Interativa** | [cifracash.vercel.app/docs](https://cifracash.vercel.app/docs) |
| **OpenAPI JSON** | [cifracash.vercel.app/api/docs](https://cifracash.vercel.app/api/docs) |

### Endpoints Principais

```
GET/POST   /api/transactions      Transacoes
GET/POST   /api/investments       Investimentos
GET/POST   /api/cards             Cartoes de credito
GET/POST   /api/goals             Metas financeiras
GET/POST   /api/budgets           Orcamentos
GET        /api/analytics         Analytics avancado
GET        /api/wealth-evolution  Evolucao patrimonial
GET        /api/financial-health  Score de saude financeira
GET/POST   /api/data/export       Exportar dados
POST       /api/data/import       Importar dados
```

---

## Licenca

Este projeto esta sob a licenca MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<p align="center">
  Desenvolvido com Next.js 16 e React 19
</p>
