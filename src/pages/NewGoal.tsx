import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NewGoal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    monthly_contribution: '',
    target_date: ''
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          name: formData.name,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount),
          monthly_contribution: formData.monthly_contribution ? parseFloat(formData.monthly_contribution) : 0,
          target_date: formData.target_date || null
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar meta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthsToGoal = () => {
    const target = parseFloat(formData.target_amount);
    const current = parseFloat(formData.current_amount) || 0;
    const monthly = parseFloat(formData.monthly_contribution) || 0;
    
    if (monthly <= 0 || target <= current) return 0;
    
    return Math.ceil((target - current) / monthly);
  };

  const monthsToGoal = calculateMonthsToGoal();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Nova Meta</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Criar Meta Financeira
            </CardTitle>
            <CardDescription>
              Defina um objetivo financeiro e acompanhe seu progresso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Meta</Label>
                <Input
                  id="name"
                  placeholder="Ex: Emergência, Viagem, Casa própria"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Valor da Meta (R$)</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_amount">Valor Atual (R$)</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({...formData, current_amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthly_contribution">Aporte Mensal (R$)</Label>
                  <Input
                    id="monthly_contribution"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.monthly_contribution}
                    onChange={(e) => setFormData({...formData, monthly_contribution: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_date">Data Objetivo (opcional)</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                  />
                </div>
              </div>

              {monthsToGoal > 0 && formData.monthly_contribution && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Projeção da Meta</h4>
                  <p className="text-sm text-muted-foreground">
                    Com aportes de R$ {parseFloat(formData.monthly_contribution).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por mês,
                    você alcançará sua meta em aproximadamente <strong>{monthsToGoal} meses</strong>.
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard')} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Salvando...' : 'Criar Meta'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}