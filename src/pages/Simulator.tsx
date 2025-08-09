import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Calculator, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Simulator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [currentAmount, setCurrentAmount] = useState([1000]);
  const [monthlyContribution, setMonthlyContribution] = useState([500]);
  const [returnRate, setReturnRate] = useState([8]);
  const [timePeriod, setTimePeriod] = useState([120]); // months

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const calculateInvestment = (months: number, rate: number) => {
    const monthlyRate = rate / 100 / 12;
    let amount = currentAmount[0];
    
    for (let i = 0; i < months; i++) {
      amount = amount * (1 + monthlyRate) + monthlyContribution[0];
    }
    
    return amount;
  };

  const generateChartData = () => {
    const data = [];
    const maxMonths = timePeriod[0];
    
    for (let month = 0; month <= maxMonths; month += 6) {
      const currentScenario = calculateInvestment(month, 0.5); // Conservative scenario
      const optimizedScenario = calculateInvestment(month, returnRate[0]);
      
      data.push({
        month: `${Math.floor(month / 12)}a ${month % 12}m`,
        atual: currentScenario,
        otimizado: optimizedScenario,
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const finalCurrentAmount = calculateInvestment(timePeriod[0], 0.5);
  const finalOptimizedAmount = calculateInvestment(timePeriod[0], returnRate[0]);
  const totalContributed = currentAmount[0] + (monthlyContribution[0] * timePeriod[0]);
  const difference = finalOptimizedAmount - finalCurrentAmount;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Simulador de Investimentos</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Parâmetros
                </CardTitle>
                <CardDescription>
                  Ajuste os valores para simular diferentes cenários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Valor Inicial: R$ {currentAmount[0].toLocaleString('pt-BR')}</Label>
                  <Slider
                    value={currentAmount}
                    onValueChange={setCurrentAmount}
                    max={50000}
                    min={0}
                    step={100}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Aporte Mensal: R$ {monthlyContribution[0].toLocaleString('pt-BR')}</Label>
                  <Slider
                    value={monthlyContribution}
                    onValueChange={setMonthlyContribution}
                    max={5000}
                    min={0}
                    step={50}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Taxa de Retorno Anual: {returnRate[0]}%</Label>
                  <Slider
                    value={returnRate}
                    onValueChange={setReturnRate}
                    max={20}
                    min={1}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Período: {Math.floor(timePeriod[0] / 12)} anos e {timePeriod[0] % 12} meses</Label>
                  <Slider
                    value={timePeriod}
                    onValueChange={setTimePeriod}
                    max={360}
                    min={12}
                    step={6}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Investido:</span>
                  <span className="font-medium">R$ {totalContributed.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cenário Atual:</span>
                  <span className="font-medium">R$ {finalCurrentAmount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cenário Otimizado:</span>
                  <span className="font-medium text-success">R$ {finalOptimizedAmount.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Diferença:</span>
                  <span className="font-bold text-success">+R$ {difference.toLocaleString('pt-BR')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Projeção de Crescimento
                </CardTitle>
                <CardDescription>
                  Comparação entre cenário conservador e otimizado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="atual" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      name="Cenário Atual (0.5% a.a.)"
                      strokeDasharray="5 5"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="otimizado" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={3}
                      name={`Cenário Otimizado (${returnRate[0]}% a.a.)`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">Rendimento Total (Otimizado)</p>
                    <p className="text-2xl font-bold text-success">
                      R$ {(finalOptimizedAmount - totalContributed).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">ROI (Retorno sobre Investimento)</p>
                    <p className="text-2xl font-bold text-info">
                      {((finalOptimizedAmount / totalContributed - 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}