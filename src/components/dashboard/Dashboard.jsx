
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Fuel, 
  Droplet
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import KPICard from '@/components/dashboard/KPICard';
import PriceChart from '@/components/dashboard/PriceChart';
import BestSupplyTable from '@/components/dashboard/BestSupplyTable';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import { supabase } from '@/lib/customSupabaseClient';

const Dashboard = () => {
  const [kpiData, setKpiData] = useState({
    avgGasoline: { value: 0, change: 0, trend: 'up' },
    avgDiesel: { value: 0, change: 0, trend: 'up' },
    avgEthanol: { value: 0, change: 0, trend: 'up' },
    usdRate: { value: 0, change: 0, trend: 'up' },
    oilPrice: { value: 0, change: 0, trend: 'up' }
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch KPIs
      let kpiResult = null;
      try {
        const { data, error: kpiError } = await supabase.rpc('get_dashboard_kpis');
        if (kpiError) {
          if (kpiError.code === '42501') {
            console.warn("RLS Error: Permission denied for function get_dashboard_kpis");
            // Continue with default values
          } else {
            throw kpiError;
          }
        } else {
          kpiResult = data;
        }
      } catch (kpiError) {
        console.error("Error fetching KPIs:", kpiError);
        // Continue with default values
      }
      
      // Fetch Oil Price (WTI Crude) using Supabase function
      let oilPrice = 0;
      let oilChange = 0;
      
      try {
        const { data: oilData, error: oilError } = await supabase.functions.invoke('fetch-oil-price');
        
        if (oilError) {
          console.error('Error fetching oil price:', oilError);
        } else if (oilData?.data) {
          oilPrice = oilData.data.price;
          // For demo purposes, we'll set a mock change value
          // In a real app, you would fetch historical data to calculate the actual change
          oilChange = 1.5; // Example change percentage
          console.log('Oil price fetched successfully:', oilData.data);
        } else {
          console.warn('No price data in response:', oilData);
        }
      } catch (error) {
        console.error('Exception in oil price fetch:', error);
      }

      setKpiData({
        avgGasoline: { value: kpiResult?.avg_gasoline || 0, change: kpiResult?.gasoline_change || 0, trend: (kpiResult?.gasoline_change || 0) >= 0 ? 'up' : 'down' },
        avgDiesel: { value: kpiResult?.avg_diesel || 0, change: kpiResult?.diesel_change || 0, trend: (kpiResult?.diesel_change || 0) >= 0 ? 'up' : 'down' },
        avgEthanol: { value: kpiResult?.avg_ethanol || 0, change: kpiResult?.ethanol_change || 0, trend: (kpiResult?.ethanol_change || 0) >= 0 ? 'up' : 'down' },
        usdRate: { value: kpiResult?.latest_usd_rate || 5.50, change: kpiResult?.usd_change || 0, trend: (kpiResult?.usd_change || 0) >= 0 ? 'up' : 'down' },
        oilPrice: { 
          value: oilPrice || 75.25, 
          change: oilChange, 
          trend: oilChange >= 0 ? 'up' : 'down' 
        }
      });

      // Fetch Alerts
      try {
        const { data: eventsData, error: eventsError } = await supabase
          .from('market_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (!eventsError && eventsData) {
          const formattedAlerts = eventsData.map(e => ({
            id: e.id,
            type: e.impact_level === 'high' ? 'error' : e.impact_level === 'medium' ? 'warning' : 'info',
            message: e.title,
            time: new Date(e.created_at).toLocaleDateString('pt-BR')
          }));
          setAlerts(formattedAlerts);
        } else if (eventsError?.code === '42501') {
          console.warn("RLS Error: Permission denied for market_events table");
          // Set empty alerts if no permission
          setAlerts([]);
        } else if (eventsError) {
          console.error("Error fetching alerts:", eventsError);
          // Keep existing alerts or set to empty array
          setAlerts([]);
        }
      } catch (eventsError) {
        console.error("Error in alerts fetch:", eventsError);
        setAlerts([]);
      }

    } catch (error) {
      if (error.message.includes("function public.get_dashboard_kpis does not exist")) {
        // This can be a sync issue, we can ignore it for now or ask user to refresh.
        console.warn("Dashboard function not available yet. It might be syncing.");
      } else {
        toast({ title: "Erro ao carregar dados do dashboard", description: error.message, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleKPIClick = (kpiType) => {
    toast({
      title: "📊 Detalhes do KPI",
      description: `Visualizando detalhes para ${kpiType}.`
    });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral dos indicadores de abastecimento.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Gasolina (Média)" value={`R$ ${kpiData.avgGasoline.value.toFixed(3)}`} change={kpiData.avgGasoline.change} trend={kpiData.avgGasoline.trend} icon={Fuel} color="blue" onClick={() => handleKPIClick('gasoline')} />
        <KPICard title="Diesel (Média)" value={`R$ ${kpiData.avgDiesel.value.toFixed(3)}`} change={kpiData.avgDiesel.change} trend={kpiData.avgDiesel.trend} icon={Fuel} color="green" onClick={() => handleKPIClick('diesel')} />
        <KPICard title="Etanol (Média)" value={`R$ ${kpiData.avgEthanol.value.toFixed(3)}`} change={kpiData.avgEthanol.change} trend={kpiData.avgEthanol.trend} icon={Fuel} color="purple" onClick={() => handleKPIClick('ethanol')} />
        <KPICard 
          title="Cotação USD" 
          value={`R$ ${kpiData.usdRate.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          change={kpiData.usdRate.change} 
          trend={kpiData.usdRate.trend} 
          icon={DollarSign} 
          color="yellow" 
          onClick={() => handleKPIClick('usd')} 
        />
        <KPICard 
          title="Petróleo (WTI)" 
          value={kpiData.oilPrice.value > 0 
            ? `$${kpiData.oilPrice.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : 'Carregando...'} 
          change={kpiData.oilPrice.change} 
          trend={kpiData.oilPrice.trend} 
          icon={Droplet} 
          color="orange" 
          onClick={() => handleKPIClick('oil')} 
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

      <AlertsPanel alerts={alerts} />
    </div>
  );
};

export default Dashboard;
