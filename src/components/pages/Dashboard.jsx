import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Fuel, 
  Activity
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import KPICard from '@/components/dashboard/KPICard';
import PriceChart from '@/components/dashboard/PriceChart';
import BestSupplyTable from '@/components/dashboard/BestSupplyTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      avgGasoline: { value: 5.42, change: -2.1, trend: 'down' },
      avgDiesel: { value: 4.89, change: 1.5, trend: 'up' },
      avgEthanol: { value: 3.67, change: -0.8, trend: 'down' },
      usdRate: { value: 5.42, change: 0.8, trend: 'up' }
    },
    alerts: [
      { id: 1, type: 'warning', message: 'Preço da gasolina em Fortaleza 5% acima da média', time: '2h' },
      { id: 2, type: 'info', message: 'Nova cotação do dólar disponível', time: '30min' },
      { id: 3, type: 'error', message: 'Falha na coleta de preços - Posto Shell 001', time: '1h' }
    ]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setDashboardData(prev => ({
        ...prev,
        kpis: {
          ...prev.kpis,
          avgGasoline: {
            ...prev.kpis.avgGasoline,
            value: prev.kpis.avgGasoline.value + (Math.random() - 0.5) * 0.01
          }
        }
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleKPIClick = (kpiType) => {
    toast({
      title: "📊 Detalhes do KPI",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral dos indicadores de abastecimento.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-green-500" />
            <span>Dados em tempo real</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Gasolina (Média)"
          value={`R$ ${dashboardData.kpis.avgGasoline.value.toFixed(2)}`}
          change={dashboardData.kpis.avgGasoline.change}
          trend={dashboardData.kpis.avgGasoline.trend}
          icon={Fuel}
          color="blue"
          onClick={() => handleKPIClick('gasoline')}
        />
        <KPICard
          title="Diesel (Média)"
          value={`R$ ${dashboardData.kpis.avgDiesel.value.toFixed(2)}`}
          change={dashboardData.kpis.avgDiesel.change}
          trend={dashboardData.kpis.avgDiesel.trend}
          icon={Fuel}
          color="green"
          onClick={() => handleKPIClick('diesel')}
        />
        <KPICard
          title="Etanol (Média)"
          value={`R$ ${dashboardData.kpis.avgEthanol.value.toFixed(2)}`}
          change={dashboardData.kpis.avgEthanol.change}
          trend={dashboardData.kpis.avgEthanol.trend}
          icon={Fuel}
          color="purple"
          onClick={() => handleKPIClick('ethanol')}
        />
        <KPICard
          title="Cotação USD"
          value={`R$ ${dashboardData.kpis.usdRate.value.toFixed(2)}`}
          change={dashboardData.kpis.usdRate.change}
          trend={dashboardData.kpis.usdRate.trend}
          icon={DollarSign}
          color="yellow"
          onClick={() => handleKPIClick('usd')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PriceChart />
        </div>
        <div className="lg:col-span-1">
          <BestSupplyTable />
        </div>
      </div>

      <AlertsPanel alerts={dashboardData.alerts} />
    </div>
  );
};

export default Dashboard;