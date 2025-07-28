import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, TrendingUp, BarChart3, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedAnalysis, setSelectedAnalysis] = useState('forecast');

  const periods = [
    { id: '7d', label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' },
    { id: '1y', label: '1 ano' }
  ];

  const analysisTypes = [
    { id: 'forecast', label: 'Previsão de Preços', icon: TrendingUp },
    { id: 'savings', label: 'Economia Acumulada', icon: PieChart },
    { id: 'trends', label: 'Tendências de Mercado', icon: BarChart3 }
  ];

  const mockForecastData = [
    { fuel: 'Gasolina', current: 5.42, forecast7d: 5.45, forecast30d: 5.52, confidence: 85 },
    { fuel: 'Diesel', current: 4.89, forecast7d: 4.92, forecast30d: 4.87, confidence: 78 },
    { fuel: 'Etanol', current: 3.67, forecast7d: 3.65, forecast30d: 3.72, confidence: 72 }
  ];

  const mockSavingsData = [
    { month: 'Janeiro', savings: 12500, decisions: 45 },
    { month: 'Dezembro', savings: 8900, decisions: 38 },
    { month: 'Novembro', savings: 15200, decisions: 52 },
    { month: 'Outubro', savings: 9800, decisions: 41 }
  ];

  const handleExportReport = () => {
    toast({
      title: "📊 Exportar Relatório",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  const renderForecastAnalysis = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {mockForecastData.map((item, index) => (
        <motion.div
          key={item.fuel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card border border-border p-6 rounded-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">{item.fuel}</h4>
            <div className={`w-3 h-3 rounded-full ${
              item.fuel === 'Gasolina' ? 'bg-blue-500' :
              item.fuel === 'Diesel' ? 'bg-green-500' : 'bg-purple-500'
            }`} />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Preço Atual</p>
              <p className="text-3xl font-bold text-foreground">R$ {item.current.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Previsão 7d</p>
                <p className="text-lg font-medium text-foreground">R$ {item.forecast7d.toFixed(2)}</p>
                <p className={`text-xs font-semibold ${item.forecast7d > item.current ? 'text-red-600' : 'text-green-600'}`}>
                  {item.forecast7d > item.current ? '▲' : '▼'} {((item.forecast7d - item.current) / item.current * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Previsão 30d</p>
                <p className="text-lg font-medium text-foreground">R$ {item.forecast30d.toFixed(2)}</p>
                <p className={`text-xs font-semibold ${item.forecast30d > item.current ? 'text-red-600' : 'text-green-600'}`}>
                  {item.forecast30d > item.current ? '▲' : '▼'} {((item.forecast30d - item.current) / item.current * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Confiança</span>
                <span className="font-semibold text-foreground">{item.confidence}%</span>
              </div>
              <div className="w-full bg-accent rounded-full h-2 mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.confidence}%` }}
                  transition={{ delay: index * 0.1 + 0.5, type: 'spring' }}
                  className="bg-primary h-2 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderSavingsAnalysis = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 bg-card border border-border p-6 rounded-xl">
        <h4 className="text-lg font-semibold text-foreground mb-6">Economia por Mês</h4>
        <div className="space-y-4">
          {mockSavingsData.map((item, index) => (
            <div key={item.month} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{item.month}</p>
                <p className="text-sm text-muted-foreground">{item.decisions} decisões</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">R$ {item.savings.toLocaleString('pt-BR')}</p>
                <div className="w-32 bg-accent rounded-full h-2 mt-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.savings / 15200) * 100}%` }}
                    transition={{ delay: index * 0.1, type: 'spring' }}
                    className="bg-green-500 h-2 rounded-full"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border p-6 rounded-xl flex flex-col justify-between">
        <h4 className="text-lg font-semibold text-foreground mb-6">Resumo Geral</h4>
        <div className="text-center">
          <p className="text-4xl font-bold text-green-600 mb-2">R$ {mockSavingsData.reduce((acc, item) => acc + item.savings, 0).toLocaleString('pt-BR')}</p>
          <p className="text-muted-foreground">Economia Total ({selectedPeriod === '30d' ? '30 dias' : 'período'})</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center bg-accent p-3 rounded-md">
            <p className="text-xl font-bold text-foreground">{mockSavingsData.reduce((acc, item) => acc + item.decisions, 0)}</p>
            <p className="text-xs text-muted-foreground">Decisões</p>
          </div>
          <div className="text-center bg-accent p-3 rounded-md">
            <p className="text-xl font-bold text-foreground">R$ {(mockSavingsData.reduce((acc, item) => acc + item.savings, 0) / mockSavingsData.reduce((acc, item) => acc + item.decisions, 0)).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Economia/Decisão</p>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderTrendsAnalysis = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-xl">
      <h4 className="text-lg font-semibold text-foreground mb-6">Análise de Tendências de Mercado</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: TrendingUp, title: 'Tendência Geral', text: 'Preços em alta moderada nos próximos 30 dias.', color: 'blue' },
          { icon: PieChart, title: 'Melhor Estratégia', text: 'Compras antecipadas para gasolina são recomendadas.', color: 'green' },
          { icon: BarChart3, title: 'Volatilidade', text: 'Diesel apresenta menor volatilidade no período analisado.', color: 'purple' }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="text-center bg-accent p-6 rounded-lg">
              <div className={`w-16 h-16 mx-auto mb-4 bg-${item.color}-500/10 rounded-full flex items-center justify-center`}>
                <Icon className={`h-8 w-8 text-${item.color}-600`} />
              </div>
              <h5 className="font-semibold text-foreground mb-2">{item.title}</h5>
              <p className="text-sm text-muted-foreground">{item.text}</p>
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderAnalysisContent = () => {
    switch (selectedAnalysis) {
      case 'forecast': return renderForecastAnalysis();
      case 'savings': return renderSavingsAnalysis();
      case 'trends': return renderTrendsAnalysis();
      default: return renderForecastAnalysis();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Análises Avançadas</h1>
          <p className="text-muted-foreground mt-1">Previsões e relatórios estratégicos.</p>
        </div>
        <Button onClick={handleExportReport} className="mt-4 sm:mt-0">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-4 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {analysisTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Button key={type.id} onClick={() => setSelectedAnalysis(type.id)} variant={selectedAnalysis === type.id ? "default" : "ghost"} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{type.label}</span>
                </Button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="bg-accent border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {periods.map((period) => (<option key={period.id} value={period.id}>{period.label}</option>))}
            </select>
          </div>
        </div>
      </motion.div>

      <motion.div key={selectedAnalysis} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {renderAnalysisContent()}
      </motion.div>
    </div>
  );
};

export default Analytics;