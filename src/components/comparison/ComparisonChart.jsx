import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ComparisonChart = ({ data, loading }) => {
  const handleChartClick = (item) => {
    toast({
      title: "📊 Detalhes do Gráfico",
      description: `Companhia: ${item.company}, Preço Médio: R$ ${item.avgPrice.toFixed(3)}`,
    });
  };

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const companyPrices = data.reduce((acc, item) => {
      if (!acc[item.company]) {
        acc[item.company] = { total: 0, count: 0 };
      }
      acc[item.company].total += item.total;
      acc[item.company].count += 1;
      return acc;
    }, {});

    return Object.entries(companyPrices).map(([company, { total, count }]) => ({
      company,
      avgPrice: total / count,
    })).sort((a, b) => a.avgPrice - b.avgPrice);
  }, [data]);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.avgPrice)) * 1.1 : 1;

  const fuelColors = {
    default: 'bg-primary',
    gasolina: 'bg-blue-500',
    diesel: 'bg-green-500',
    etanol: 'bg-purple-500',
  };

  const getFuelColor = (fuelName) => {
    const lowerCaseFuel = fuelName.toLowerCase();
    if (lowerCaseFuel.includes('gasolina')) return fuelColors.gasolina;
    if (lowerCaseFuel.includes('diesel')) return fuelColors.diesel;
    if (lowerCaseFuel.includes('etanol')) return fuelColors.etanol;
    return fuelColors.default;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border p-6 rounded-xl"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Comparativo Visual de Preços</h3>
        <p className="text-sm text-muted-foreground">Preço médio total por companhia</p>
      </div>

      {loading ? (
        <div className="text-center p-8 text-muted-foreground">Carregando gráfico...</div>
      ) : chartData.length === 0 ? (
        <div className="text-center p-8 text-muted-foreground">Não há dados suficientes para exibir o gráfico.</div>
      ) : (
        <div className="space-y-4">
          {chartData.map((item, index) => (
            <motion.div
              key={item.company}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleChartClick(item)}
              className="cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <h4 className="text-sm font-semibold text-foreground w-24 truncate">{item.company}</h4>
                <div className="flex-1 bg-accent rounded-md h-8 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.avgPrice / maxValue) * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.2, type: 'spring', stiffness: 100 }}
                    className="h-full bg-primary group-hover:opacity-80 transition-opacity"
                  />
                  <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-primary-foreground">
                    R$ {item.avgPrice.toFixed(3)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ComparisonChart;