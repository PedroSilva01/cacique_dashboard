
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const BestSupplyTable = () => {
  const [bestSupplies, setBestSupplies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBestSupplies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_best_supply_options');
    if (error) {
      if (!error.message.includes("function public.get_best_supply_options does not exist")) {
        toast({ title: "Erro ao buscar melhores opções", description: error.message, variant: "destructive" });
      }
      setBestSupplies([]);
    } else {
      setBestSupplies(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBestSupplies();
  }, [fetchBestSupplies]);

  const handleSupplyClick = (supply) => {
    toast({
      title: "🏪 Detalhes do Fornecedor",
      description: `Melhor opção para ${supply.fuel_name} na base ${supply.base_name}.`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border p-6 rounded-xl h-full flex flex-col"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Melhores Opções de Compra</h3>
        <p className="text-sm text-muted-foreground">Recomendações por combustível e base</p>
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto">
        {loading ? <div className="text-center p-8">Carregando...</div> :
        bestSupplies.length === 0 ? <div className="text-center p-8 text-muted-foreground">Sem dados para exibir. Adicione entradas de preço.</div> :
        bestSupplies.map((supply, index) => (
          <motion.div
            key={`${supply.fuel_name}-${supply.base_name}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleSupplyClick(supply)}
            className="bg-accent/50 p-4 rounded-lg cursor-pointer hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  supply.fuel_name.toLowerCase().includes('gasolina') ? 'bg-blue-500' :
                  supply.fuel_name.toLowerCase().includes('diesel') ? 'bg-green-500' : 'bg-purple-500'
                }`} />
                <div>
                  <p className="font-semibold text-foreground">{supply.fuel_name}</p>
                  <p className="text-sm text-muted-foreground">{supply.company_name}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-foreground">R$ {parseFloat(supply.best_price).toFixed(3)}</p>
                <div className="flex items-center justify-end gap-1 text-green-600">
                  <TrendingDown className="h-3 w-3" />
                  <span className="text-xs font-medium">Economia de R$ {parseFloat(supply.savings).toFixed(3)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{supply.base_name}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Button
          onClick={() => toast({title: "Indo para o comparativo..."})}
          variant="outline"
          className="w-full"
        >
          Ver Comparativo Completo
        </Button>
      </div>
    </motion.div>
  );
};

export default BestSupplyTable;
