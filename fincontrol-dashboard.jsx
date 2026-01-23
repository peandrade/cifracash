import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Dados iniciais mockados
const initialTransactions = [
  { id: 1, type: 'expense', value: 1200, category: 'Aluguel', date: '2025-01-05', description: 'Aluguel janeiro' },
  { id: 2, type: 'expense', value: 450, category: 'Supermercado', date: '2025-01-08', description: 'Compras semanais' },
  { id: 3, type: 'income', value: 6500, category: 'Salário', date: '2025-01-10', description: 'Salário janeiro' },
  { id: 4, type: 'expense', value: 89.90, category: 'Streaming', date: '2025-01-12', description: 'Netflix + Spotify' },
  { id: 5, type: 'expense', value: 156, category: 'Restaurante', date: '2025-01-14', description: 'Jantar aniversário' },
  { id: 6, type: 'expense', value: 67, category: 'Delivery', date: '2025-01-15', description: 'iFood' },
  { id: 7, type: 'expense', value: 230, category: 'Luz', date: '2025-01-16', description: 'Conta de luz' },
  { id: 8, type: 'expense', value: 95, category: 'Internet', date: '2025-01-17', description: 'Internet fibra' },
  { id: 9, type: 'income', value: 800, category: 'Freelance', date: '2025-01-18', description: 'Projeto site' },
  { id: 10, type: 'expense', value: 45, category: 'Transporte', date: '2025-01-19', description: 'Uber semana' },
];

const categories = {
  expense: ['Aluguel', 'Supermercado', 'Restaurante', 'Delivery', 'Transporte', 'Luz', 'Água', 'Internet', 'Streaming', 'Lazer', 'Saúde', 'Educação', 'Outros'],
  income: ['Salário', 'Freelance', 'Investimentos', 'Outros']
};

const categoryColors = {
  'Aluguel': '#8B5CF6',
  'Supermercado': '#F59E0B',
  'Restaurante': '#EC4899',
  'Delivery': '#EF4444',
  'Transporte': '#3B82F6',
  'Luz': '#10B981',
  'Água': '#06B6D4',
  'Internet': '#6366F1',
  'Streaming': '#A855F7',
  'Lazer': '#F97316',
  'Saúde': '#14B8A6',
  'Educação': '#8B5CF6',
  'Salário': '#22C55E',
  'Freelance': '#84CC16',
  'Investimentos': '#0EA5E9',
  'Outros': '#64748B'
};

const monthlyData = [
  { month: 'Ago', receitas: 6500, despesas: 4200 },
  { month: 'Set', receitas: 7300, despesas: 3800 },
  { month: 'Out', receitas: 6500, despesas: 5100 },
  { month: 'Nov', receitas: 8200, despesas: 4600 },
  { month: 'Dez', receitas: 9500, despesas: 6200 },
  { month: 'Jan', receitas: 7300, despesas: 2332.90 },
];

// Formatador de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Componente de ícone
const Icon = ({ name, className = "w-5 h-5" }) => {
  const icons = {
    plus: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
    trending_up: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
    trending_down: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" /></svg>,
    wallet: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    x: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
    arrow_up: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
    arrow_down: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
    calendar: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
    trash: <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  };
  return icons[name] || null;
};

// Modal de Nova Transação
const TransactionModal = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState('expense');
  const [value, setValue] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value || !category) return;
    
    onSave({
      id: Date.now(),
      type,
      value: parseFloat(value),
      category,
      date,
      description
    });
    
    setValue('');
    setCategory('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl"
        style={{ animation: 'slideUp 0.3s ease-out' }}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Nova Transação</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Icon name="x" className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                type === 'expense' 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                type === 'income' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Receita
            </button>
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Valor</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-[#1a1a2e]">Selecione uma categoria</option>
              {categories[type].map(cat => (
                <option key={cat} value={cat} className="bg-[#1a1a2e]">{cat}</option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              required
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Descrição (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compras do mês"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente Principal
export default function FinControlDashboard() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth] = useState('Janeiro 2025');

  // Cálculos
  const totals = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.value, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.value, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  // Dados para o gráfico de pizza
  const pieData = useMemo(() => {
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.value;
        return acc;
      }, {});
    
    return Object.entries(expensesByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalExpenses = pieData.reduce((sum, item) => sum + item.value, 0);

  // Adicionar transação
  const handleAddTransaction = (transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  // Remover transação
  const handleDeleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Tooltip customizado para o gráfico de área
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 shadow-xl">
          <p className="text-gray-400 text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
              {entry.name === 'receitas' ? 'Receitas' : 'Despesas'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Estilos inline para animações */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .card-hover {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
        }
      `}</style>

      {/* Background decorativo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-3xl" />
      </div>

      {/* Container principal */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">
              <Icon name="calendar" className="w-4 h-4" />
              {selectedMonth}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 rounded-xl font-medium transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
          >
            <Icon name="plus" className="w-5 h-5" />
            Nova Transação
          </button>
        </header>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Receitas */}
          <div className="card-hover bg-gradient-to-br from-emerald-500/90 to-teal-600/90 rounded-2xl p-6 shadow-xl shadow-emerald-500/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Receitas do mês</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.income)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Icon name="trending_up" className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-emerald-100 text-sm">
              <Icon name="arrow_up" className="w-4 h-4" />
              <span>+12.5% vs mês anterior</span>
            </div>
          </div>

          {/* Despesas */}
          <div className="card-hover bg-gradient-to-br from-orange-500/90 to-red-500/90 rounded-2xl p-6 shadow-xl shadow-orange-500/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-1">Despesas do mês</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.expense)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Icon name="trending_down" className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-orange-100 text-sm">
              <Icon name="arrow_down" className="w-4 h-4" />
              <span>-8.3% vs mês anterior</span>
            </div>
          </div>

          {/* Saldo */}
          <div className={`card-hover bg-gradient-to-br ${totals.balance >= 0 ? 'from-cyan-500/90 to-blue-600/90 shadow-cyan-500/10' : 'from-red-600/90 to-rose-700/90 shadow-red-500/10'} rounded-2xl p-6 shadow-xl`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-cyan-100 text-sm font-medium mb-1">Saldo do mês</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(totals.balance)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Icon name="wallet" className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-cyan-100 text-sm">
              <span>{totals.balance >= 0 ? '✨ Saldo positivo!' : '⚠️ Atenção aos gastos'}</span>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Gráfico de Evolução */}
          <div className="lg:col-span-2 bg-[#1a1a2e]/80 backdrop-blur border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Evolução Mensal</h3>
            <p className="text-gray-500 text-sm mb-6">Receitas vs Despesas (últimos 6 meses)</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="receitas" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorReceitas)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="despesas" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorDespesas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-400 text-sm">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-gray-400 text-sm">Despesas</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Categorias */}
          <div className="bg-[#1a1a2e]/80 backdrop-blur border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Analytics</h3>
            <p className="text-gray-500 text-sm mb-4">Despesas por categoria</p>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={categoryColors[entry.name] || '#64748B'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legenda */}
            <div className="space-y-2 mt-4 max-h-32 overflow-y-auto">
              {pieData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: categoryColors[item.name] || '#64748B' }}
                    />
                    <span className="text-gray-400">{item.name}</span>
                  </div>
                  <span className="text-gray-300 font-medium">
                    {((item.value / totalExpenses) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Últimas Transações */}
        <div className="bg-[#1a1a2e]/80 backdrop-blur border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Últimas Transações</h3>
              <p className="text-gray-500 text-sm">Histórico recente de movimentações</p>
            </div>
            <span className="text-gray-500 text-sm">{transactions.length} transações</span>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {transactions
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((transaction) => (
                <div 
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${categoryColors[transaction.category]}20`,
                        color: categoryColors[transaction.category]
                      }}
                    >
                      {transaction.type === 'income' ? (
                        <Icon name="arrow_up" className="w-5 h-5" />
                      ) : (
                        <Icon name="arrow_down" className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{transaction.description || transaction.category}</p>
                      <p className="text-gray-500 text-sm">{transaction.category} • {new Date(transaction.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-semibold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.value)}
                    </p>
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Icon name="trash" className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddTransaction}
      />
    </div>
  );
}
