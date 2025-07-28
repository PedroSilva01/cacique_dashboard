
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const PriceChart = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const periods = [
    { id: 7, label: '7D' },
    { id: 30, label: '30D' },
    { id: 90, label: '90D' }
  ];

  const fetchChartData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_price_trends', { days_period: selectedPeriod });
    if (error) {
      if (!error.message.includes("function public.get_price_trends does not exist")) {
        toast({ title: "Erro ao buscar dados do gráfico", description: error.message, variant: "destructive" });
      }
      setChartData([]);
    } else {
      setChartData(data || []);
    }
    setLoading(false);
  }, [selectedPeriod]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.flatMap(d => [d.avg_gasoline, d.avg_diesel, d.avg_ethanol].map(p => parseFloat(p || 0)))) * 1.1 : 1;

  const handleChartClick = () => {
    toast({
      title: "📈 Gráfico Interativo",
      description: "🚧 Este recurso ainda não foi implementado!"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card border border-border p-6 rounded-xl h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Tendência de Preços</h3>
          <p className="text-sm text-muted-foreground">Evolução dos combustíveis</p>
        </div>
        
        <div className="flex items-center bg-accent p-1 rounded-md">
          {periods.map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedPeriod(period.id)}
              className="text-xs px-3"
            >
              {period.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-grow space-y-4">
        {loading ? <div className="text-center p-8">Carregando...</div> :
        chartData.length === 0 ? <div className="text-center p-8 text-muted-foreground">Sem dados para o período. Adicione entradas de preço.</div> :
        chartData.map((item, index) => (
          <motion.div
            key={item.entry_day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 text-sm text-muted-foreground font-medium text-right">
              {new Date(item.entry_day).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </div>
            
            <div className="flex-1 grid grid-cols-3 gap-2">
              {[
                { fuel: 'gasoline', value: item.avg_gasoline, color: 'bg-blue-500' },
                { fuel: 'diesel', value: item.avg_diesel, color: 'bg-green-500' },
                { fuel: 'ethanol', value: item.avg_ethanol, color: 'bg-purple-500' }
              ].map(({ fuel, value, color }) => (
                <div key={fuel} className="flex items-center gap-2">
                  <div className="flex-1 bg-accent rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(parseFloat(value || 0) / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.05 + 0.2, type: 'spring', stiffness: 100 }}
                      className={`h-full ${color}`}
                    />
                  </div>
                  <div className="w-12 text-xs text-foreground font-medium">
                    {parseFloat(value || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div><span className="text-muted-foreground">Gasolina</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div><span className="text-muted-foreground">Diesel</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-purple-500 rounded-full"></div><span className="text-muted-foreground">Etanol</span></div>
        </div>
        <Button onClick={handleChartClick} variant="ghost" size="sm" className="text-primary hover:text-primary"><TrendingUp className="h-4 w-4 mr-2" />Análise Detalhada</Button>
      </div>
    </motion.div>
  );
};

export default PriceChart;
