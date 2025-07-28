
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Truck, Plus, Edit, Trash2, MapPin, DollarSign, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { handleSupabaseError } from '@/lib/supabaseErrorHandler';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

const FreightManagement = () => {
  const [routes, setRoutes] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('freights')
        .select('*, origin_base:bases(name)')
        .order('created_at', { ascending: false });

      if (error) {
        handleSupabaseError(error, 'buscar rotas de frete');
        setRoutes([]);
        return;
      }
      
      setRoutes(data?.map(r => ({ ...r, origin: r.origin_base?.name })) || []);
    } catch (error) {
      console.error('Erro ao buscar rotas:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível carregar as rotas de frete. Tente novamente mais tarde.',
        variant: 'destructive'
      });
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('bases')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        handleSupabaseError(error, 'buscar bases');
        return;
      }
      setBases(data || []);
    } catch (error) {
      console.error('Erro ao buscar bases:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Não foi possível carregar a lista de bases.',
        variant: 'destructive'
      });
    }
  }, []);

  useEffect(() => {
    fetchRoutes();
    fetchBases();
  }, [fetchRoutes, fetchBases]);

  const handleOpenDialog = (route = null) => {
    setCurrentRoute(route || { origin_base_id: '', destination_city: '', cost_per_liter: '' });
    setDialogOpen(true);
  };

  const handleSaveRoute = async () => {
    if (!currentRoute?.origin_base_id || !currentRoute?.destination_city || !currentRoute?.cost_per_liter) {
      toast({ 
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive' 
      });
      return;
    }
    
    try {
      const { id, origin, ...upsertData } = currentRoute;
      const { data, error } = await supabase
        .from('freights')
        .upsert(upsertData, { onConflict: 'id' })
        .select('*, origin_base:bases(name)');

      if (error) {
        handleSupabaseError(error, 'salvar rota de frete');
        return;
      }
      
      if (data && data[0]) {
        const savedRoute = { ...data[0], origin: data[0].origin_base?.name };
        setRoutes(prev => {
          const exists = prev.some(r => r.id === savedRoute.id);
          if (exists) {
            return prev.map(r => r.id === savedRoute.id ? savedRoute : r);
          }
          return [savedRoute, ...prev];
        });
        
        toast({
          title: 'Sucesso!',
          description: `Rota ${id ? 'atualizada' : 'criada'} com sucesso.`,
        });
        
        setDialogOpen(false);
      }
    } catch (error) {
      console.error("Error in handleSaveRoute:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar a rota. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      const { error } = await supabase.from('freights').delete().eq('id', routeId);
      
      if (error) {
        if (error.code === '42501') {
          toast({ 
            title: "Permissão necessária",
            description: "Você não tem permissão para excluir rotas de frete.",
            variant: "destructive"
          });
        } else {
          toast({ 
            title: "Erro ao excluir rota", 
            description: error.message, 
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Rota excluída com sucesso!",
          variant: "success"
        });
        fetchRoutes();
      }
    } catch (error) {
      console.error("Error in handleDeleteRoute:", error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao excluir a rota. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Fretes</h1>
          <p className="text-muted-foreground mt-1">Controle de rotas e custos de transporte.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0">
              <Plus className="h-4 w-4 mr-2" /> Nova Rota
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentRoute?.id ? 'Editar' : 'Nova'} Rota</DialogTitle>
              <DialogDescription>Preencha os detalhes da rota de frete.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Origem (Base)</Label>
                <select 
                  value={currentRoute?.origin_base_id || ''} 
                  onChange={(e) => setCurrentRoute({ ...currentRoute, origin_base_id: e.target.value })} 
                  className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Selecione a base</option>
                  {bases.map(base => (
                    <option key={base.id} value={base.id}>
                      {base.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Destino (Cidade)</Label>
                <Input 
                  value={currentRoute?.destination_city || ''} 
                  onChange={(e) => setCurrentRoute({ ...currentRoute, destination_city: e.target.value })} 
                />
              </div>
              <div>
                <Label>Custo por Litro (R$)</Label>
                <Input 
                  type="number" 
                  step="0.001" 
                  min="0"
                  value={currentRoute?.cost_per_liter || ''} 
                  onChange={(e) => setCurrentRoute({ ...currentRoute, cost_per_liter: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRoute}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Origem</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Destino</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Preço/L</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (<tr><td colSpan="4" className="text-center p-8">Carregando rotas...</td></tr>) :
              routes.map((route, index) => (
                <motion.tr key={route.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.05 }} className="hover:bg-accent transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap"><p className="text-foreground font-semibold">{route.origin}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{route.destination_city}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="text-foreground font-semibold">R$ {parseFloat(route.cost_per_liter).toFixed(3)}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button onClick={() => handleOpenDialog(route)} variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                      <Button onClick={() => handleDeleteRoute(route.id)} variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

// Wrap the component with ErrorBoundary for additional safety
export default function FreightManagementWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <FreightManagement />
    </ErrorBoundary>
  );
}