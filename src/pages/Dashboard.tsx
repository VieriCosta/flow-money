import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingDown, 
  Target, 
  PlusCircle,
  Wallet,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  monthly_contribution: number;
}

interface DashboardData {
  totalBalance: number;
  monthlyExpenses: number;
  goalsProgress: number;
  goals: Goal[];
  recentTransactions: any[];
  expensesByCategory: any[];
  balanceHistory: any[];
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData>({
    totalBalance: 0,
    monthlyExpenses: 0,
    goalsProgress: 0,
    goals: [],
    recentTransactions: [],
    expensesByCategory: [],
    balanceHistory: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchDashboardData = async () => {
    try {
      // Fetch accounts for total balance
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id);

      const totalBalance = accounts?.reduce((sum, account) => sum + Number(account.balance), 0) || 0;

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name, color, icon),
          accounts (name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(5);

      // Calculate monthly expenses for current month
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      const monthlyExpenses = monthlyTransactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;

      // Fetch goals with more details
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      const goalsProgress = goals?.length > 0 
        ? goals.reduce((sum, goal) => sum + (Number(goal.current_amount) / Number(goal.target_amount)), 0) / goals.length * 100
        : 0;

      // Fetch expenses by category from actual transactions
      const { data: expenseTransactions } = await supabase
        .from('transactions')
        .select(`
          amount,
          categories (name, color)
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
        .lt('date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);

      console.log('Expense transactions:', expenseTransactions);

      // Group expenses by category
      const categoryMap = new Map();
      expenseTransactions?.forEach(transaction => {
        const categoryName = transaction.categories?.name || 'Outros';
        const categoryColor = transaction.categories?.color || '#6B7280';
        const amount = Number(transaction.amount);
        
        if (categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, {
            ...categoryMap.get(categoryName),
            value: categoryMap.get(categoryName).value + amount
          });
        } else {
          categoryMap.set(categoryName, {
            name: categoryName,
            value: amount,
            color: categoryColor
          });
        }
      });

      let expensesByCategory = Array.from(categoryMap.values());
      
      // Se não houver dados, mostrar categorias padrão com valor 0
      if (expensesByCategory.length === 0) {
        expensesByCategory = [
          { name: 'Nenhum gasto registrado', value: 0, color: '#9CA3AF' }
        ];
      }

      console.log('Expenses by category:', expensesByCategory);

      // Calculate balance history for last 4 months
      const balanceHistory = [];
      for (let i = 3; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const monthStr = date.toLocaleDateString('pt-BR', { month: 'short' });
        
        // Get transactions up to this month
        const { data: historyTransactions } = await supabase
          .from('transactions')
          .select('amount, type')
          .eq('user_id', user.id)
          .lte('date', date.toISOString().split('T')[0]);

        let balance = 0;
        historyTransactions?.forEach(transaction => {
          if (transaction.type === 'income') {
            balance += Number(transaction.amount);
          } else {
            balance -= Number(transaction.amount);
          }
        });

        balanceHistory.push({
          month: monthStr,
          balance: balance
        });
      }

      setData({
        totalBalance,
        monthlyExpenses,
        goalsProgress,
        goals: goals || [],
        recentTransactions: transactions || [],
        expensesByCategory,
        balanceHistory
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">FinanceApp</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Olá! 👋</h2>
          <p className="text-muted-foreground">
            Aqui está um resumo das suas finanças - {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/reports')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {data.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Clique para ver detalhes
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/reports')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos do Mês</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {data.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => navigate('/new-goal')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso das Metas</CardTitle>
              <Target className="h-4 w-4 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-info">
                {data.goalsProgress.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Clique para gerenciar metas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>Distribuição dos gastos do mês atual</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-4">
                {data.expensesByCategory.map((category, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Balance Evolution */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Saldo</CardTitle>
              <CardDescription>Saldo dos últimos 4 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data.balanceHistory}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Goals Section */}
        {data.goals.length > 0 && (
          <div className="mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Suas Metas</CardTitle>
                  <CardDescription>Acompanhe o progresso das suas metas financeiras</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/new-goal')}>
                  <Target className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.goals.slice(0, 4).map((goal) => {
                    const progressPercentage = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                    const daysToTarget = goal.target_date ? 
                      Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
                    
                    return (
                      <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{goal.name}</h4>
                          <Badge variant={progressPercentage >= 100 ? "default" : "secondary"}>
                            {progressPercentage.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progresso</span>
                            <span>
                              R$ {Number(goal.current_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                              R$ {Number(goal.target_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            Contribuição: R$ {Number(goal.monthly_contribution).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                          {daysToTarget && daysToTarget > 0 && (
                            <span>{daysToTarget} dias restantes</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {data.goals.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline" onClick={() => navigate('/new-goal')}>
                      Ver mais {data.goals.length - 4} meta(s)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Transactions & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>Suas últimas movimentações</CardDescription>
            </CardHeader>
            <CardContent>
              {data.recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {data.recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                        }`}>
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description || transaction.categories?.name}</p>
                          <p className="text-sm text-muted-foreground">{transaction.accounts?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}R$ {Number(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                  <p className="text-sm text-muted-foreground">Adicione sua primeira transação para começar</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso direto às principais funcionalidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/new-transaction')}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/new-goal')}>
                <Target className="h-4 w-4 mr-2" />
                Criar Meta
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Ver Relatórios
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/simulator')}>
                <Settings className="h-4 w-4 mr-2" />
                Simulador
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}