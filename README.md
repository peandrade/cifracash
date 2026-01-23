# FinControl

Sistema completo de controle financeiro pessoal desenvolvido com Next.js 15, React 19 e Prisma.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

## Funcionalidades

### Dashboard
- Resumo financeiro mensal (receitas, despesas, saldo)
- Gráfico de evolução mensal (1 semana a 1 ano)
- Gráfico de despesas por categoria
- Evolução patrimonial consolidada
- Estatísticas rápidas

### Transações
- Registro de receitas e despesas
- Busca por descrição e categoria
- Filtros avançados (período, tipo, categoria, faixa de valor)
- Templates/Atalhos para transações frequentes
- Botões de ação rápida (FAB)

### Investimentos
- Renda Variável: Ações, FIIs, ETFs, Criptomoedas
- Renda Fixa: CDBs, Tesouro Direto, LCI/LCA
- Histórico de operações (compra/venda/depósito/resgate)
- Cálculo automático de rentabilidade
- Alocação por tipo de ativo

### Cartões de Crédito
- Cadastro de múltiplos cartões
- Controle de faturas mensais
- Registro de compras (à vista e parceladas)
- Acompanhamento de limite disponível

### Orçamentos
- Definição de limites por categoria
- Acompanhamento de gastos vs. orçamento
- Alertas visuais de consumo

### Despesas Recorrentes
- Cadastro de contas fixas mensais
- Lançamento automático como transação
- Controle de vencimentos

### Metas Financeiras
- Reserva de emergência
- Viagens, Carro, Casa, Educação
- Registro de contribuições
- Acompanhamento de progresso

### Autenticação
- Login com email e senha
- Registro de novos usuários
- Recuperação de senha por email

## Tecnologias

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript 5 |
| UI | React 19, TailwindCSS 4 |
| Banco de Dados | PostgreSQL + Prisma ORM |
| Autenticação | NextAuth.js v5 (Auth.js) |
| Estado | Zustand |
| Gráficos | Recharts |
| Formulários | React Hook Form + Zod |
| Ícones | Lucide React |
| Email | Nodemailer / Resend |

## Estrutura do Projeto

```
fincontrol/
├── prisma/
│   ├── schema.prisma      # Modelos do banco de dados
│   └── seed.ts            # Dados de exemplo
├── src/
│   ├── app/
│   │   ├── (auth)/        # Páginas de autenticação
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # Autenticação
│   │   │   ├── transactions/
│   │   │   ├── templates/
│   │   │   ├── investments/
│   │   │   ├── cards/
│   │   │   ├── budgets/
│   │   │   ├── goals/
│   │   │   └── ...
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Dashboard
│   ├── components/
│   │   ├── budget/        # Componentes de orçamento
│   │   ├── dashboard/     # Cards, gráficos, listas
│   │   ├── filters/       # Filtros de transações
│   │   ├── forms/         # Modais de formulário
│   │   ├── quick-transaction/ # FAB e templates
│   │   ├── recurring/     # Despesas recorrentes
│   │   └── ui/            # Componentes base
│   ├── lib/
│   │   ├── auth.ts        # Configuração NextAuth
│   │   ├── prisma.ts      # Cliente Prisma
│   │   ├── utils.ts       # Utilitários
│   │   └── constants.ts   # Constantes
│   ├── store/
│   │   ├── transaction-store.ts
│   │   ├── template-store.ts
│   │   ├── category-store.ts
│   │   └── ...
│   └── types/
│       └── index.ts       # Tipos TypeScript
├── public/
├── .env                   # Variáveis de ambiente
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Instalação

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/fincontrol.git
cd fincontrol
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/fincontrol"

# NextAuth
AUTH_SECRET="sua-chave-secreta-aqui"
AUTH_URL="http://localhost:3000"

# Email (opcional, para recuperação de senha)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="sua-senha-de-app"
EMAIL_FROM="FinControl <noreply@fincontrol.com>"
```

4. **Configure o banco de dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar o schema no banco
npx prisma db push

# (Opcional) Popular com dados de exemplo
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção |
| `npm run lint` | Executa o linter |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run db:push` | Aplica alterações do schema |
| `npm run db:studio` | Abre o Prisma Studio |

## Modelos do Banco de Dados

### Principais Entidades

- **User** - Usuários do sistema
- **Transaction** - Transações (receitas/despesas)
- **Category** - Categorias personalizáveis
- **TransactionTemplate** - Templates de transações frequentes
- **Investment** - Investimentos (ações, FIIs, CDBs, etc.)
- **Operation** - Operações de investimento
- **CreditCard** - Cartões de crédito
- **Invoice** - Faturas mensais
- **Purchase** - Compras no cartão
- **Budget** - Orçamentos por categoria
- **RecurringExpense** - Despesas fixas mensais
- **FinancialGoal** - Metas financeiras
- **GoalContribution** - Contribuições para metas

## API Routes

### Transações
- `GET /api/transactions` - Lista transações
- `POST /api/transactions` - Cria transação
- `DELETE /api/transactions/[id]` - Remove transação

### Templates
- `GET /api/templates` - Lista templates
- `POST /api/templates` - Cria template
- `PUT /api/templates/[id]` - Atualiza template
- `DELETE /api/templates/[id]` - Remove template

### Investimentos
- `GET /api/investments` - Lista investimentos
- `POST /api/investments` - Cria investimento
- `PUT /api/investments/[id]` - Atualiza investimento
- `DELETE /api/investments/[id]` - Remove investimento
- `POST /api/investments/[id]/operations` - Adiciona operação

### Cartões
- `GET /api/cards` - Lista cartões
- `POST /api/cards` - Cria cartão
- `GET /api/cards/[id]` - Detalhes do cartão
- `PUT /api/cards/[id]` - Atualiza cartão
- `DELETE /api/cards/[id]` - Remove cartão

### Metas
- `GET /api/goals` - Lista metas
- `POST /api/goals` - Cria meta
- `PUT /api/goals/[id]` - Atualiza meta
- `POST /api/goals/[id]/contribute` - Adiciona contribuição

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com Next.js e React
