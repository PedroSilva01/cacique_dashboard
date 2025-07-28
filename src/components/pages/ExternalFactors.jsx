import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar, Plus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const ExternalFactors = () => {
  const [usdRate, setUsdRate] = useState({ current: 0, change: 0, trend: 'up', history: [], lastUpdate: null });
  const [loadingUsd, setLoadingUsd] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [events, setEvents] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);

  const eventTypes = [
    { value: 'increase', label: 'Aumento de Preço', icon: <TrendingUp/>, color: 'text-red-600' },
    { value: 'decrease', label: 'Redução de Preço', icon: <TrendingDown/>, color: 'text-green-600' },
    { value: 'maintenance', label: 'Parada de Base', icon: <Calendar/>, color: 'text-yellow-600' },
    { value: 'strike', label: 'Greve/Manifestação', icon: <AlertTriangle/>, color: 'text-orange-600' },
    { value: 'other', label: 'Outro', icon: <AlertTriangle/>, color: 'text-blue-600' },
  ];

  const impactLevels = [
    { value: 'high', label: 'Alto', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    { value: 'medium', label: 'Médio', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    { value: 'low', label: 'Baixo', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
  ];

  const fetchDollarRate = useCallback(async () => {
    setLoadingUsd(true);
    try {
      const {data: dbData, error} = await supabase.from('dollar_rates').select('*').order('rate_date', {ascending: false}).limit(7);
      if(error || !dbData || dbData.length < 2) {
         toast({ title: "Buscando cotação na API do Banco Central...", variant: "default" });
         const today = new Date();
         const sevenDaysAgo = new Date(today);
         sevenDaysAgo.setDate(today.getDate() - 7);
         const formatDateForAPI = (date) => `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${date.getFullYear()}`;
         const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@dataInicial='${formatDateForAPI(sevenDaysAgo)}'&@dataFinalCotacao='${formatDateForAPI(today)}'&$top=100&$format=json&$select=cotacaoVenda,dataHoraCotacao`;
         const response = await fetch(url);
         if (!response.ok) throw new Error('Falha na resposta da API');
         const data = await response.json();
         const rates = data.value.reverse();
         if (rates.length < 2) throw new Error("Dados da API insuficientes");
         const latestRate = rates[rates.length - 1].cotacaoVenda;
         const firstRate = rates[0].cotacaoVenda;
         const change = (((latestRate - firstRate) / firstRate) * 100).toFixed(2);
         setUsdRate({ current: latestRate, change: change, trend: change >= 0 ? 'up' : 'down', history: rates.map(r => ({ date: r.dataHoraCotacao.split(' ')[0], rate: r.cotacaoVenda })), lastUpdate: new Date(rates[rates.length - 1].dataHoraCotacao).toISOString() });
      } else {
        const latestRate = dbData[0].sell_rate;
        const firstRate = dbData[dbData.length - 1].sell_rate;
        const change = (((latestRate - firstRate) / firstRate) * 100).toFixed(2);
        setUsdRate({ current: latestRate, change: change, trend: change >= 0 ? 'up' : 'down', history: dbData.map(r => ({ date: r.rate_date, rate: r.sell_rate })).reverse(), lastUpdate: new Date(dbData[0].rate_date).toISOString() });
      }
    } catch (error) { toast({ title: "Erro ao buscar cotação do dólar", description: error.message, variant: "destructive" }); } 
    finally { setLoadingUsd(false); }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    const { data, error } = await supabase.from('market_events').select('*').order('event_date', { ascending: false });
    if (error) {
      toast({ title: "Erro ao buscar eventos", description: error.message, variant: "destructive" });
    } else {
      setEvents(data);
    }
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    fetchDollarRate();
    fetchEvents();
  }, [fetchDollarRate, fetchEvents]);

  const handleOpenDialog = (event = null) => {
    setCurrentEvent(event || { title: '', description: '', event_type: 'increase', impact_level: 'medium', event_date: new Date().toISOString().slice(0, 10) });
    setDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!currentEvent.title || !currentEvent.event_date) {
      toast({ title: "Campos obrigatórios", description: "Título e Data do Evento são obrigatórios.", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from('market_events').upsert(currentEvent, { onConflict: 'id' });
    if (error) {
      toast({ title: "Erro ao salvar evento", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Evento ${currentEvent.id ? 'atualizado' : 'criado'} com sucesso!` });
      setDialogOpen(false);
      fetchEvents();
    }
  };
  
  const handleDeleteEvent = async (eventId) => {
      const { error } = await supabase.from('market_events').delete().eq('id', eventId);
      if (error) {
          toast({ title: "Erro ao excluir evento", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Evento excluído com sucesso!" });
          fetchEvents();
      }
  };

  const getEventIcon = (type) => eventTypes.find(t => t.value === type)?.icon || <AlertTriangle/>;
  const getImpactColor = (level) => impactLevels.find(l => l.value === level)?.color || 'bg-gray-500/10 text-gray-600 border-gray-500/20';

  const maxValue = usdRate.history.length > 0 ? Math.max(...usdRate.history.map(d => d.rate)) * 1.05 : 1;
  const minValue = usdRate.history.length > 0 ? Math.min(...usdRate.history.map(d => d.rate)) * 0.95 : 0;

  return (
    <div className="space-y-6">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentEvent?.id ? 'Editar' : 'Novo'} Evento de Mercado</DialogTitle>
              <DialogDescription>Preencha os detalhes para criar ou atualizar um evento.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div><Label>Título</Label><Input value={currentEvent?.title} onChange={(e) => setCurrentEvent({ ...currentEvent, title: e.target.value })} /></div>
              <div><Label>Descrição</Label><Textarea value={currentEvent?.description} onChange={(e) => setCurrentEvent({ ...currentEvent, description: e.target.value })} /></div>
              <div><Label>Tipo de Evento</Label><select value={currentEvent?.event_type} onChange={(e) => setCurrentEvent({ ...currentEvent, event_type: e.target.value })} className="w-full mt-1 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">{eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><Label>Nível de Impacto</Label><select value={currentEvent?.impact_level} onChange={(e) => setCurrentEvent({ ...currentEvent, impact_level: e.target.value })} className="w-full mt-1 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">{impactLevels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}</select></div>
              <div><Label>Data do Evento</Label><Input type="date" value={currentEvent?.event_date} onChange={(e) => setCurrentEvent({ ...currentEvent, event_date: e.target.value })}/></div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveEvent}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
      </Dialog>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Fatores Externos</h1>
          <p className="text-muted-foreground mt-1">Monitoramento de eventos e cotações.</p>
        </div>
         <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0"><Plus className="h-4 w-4 mr-2" />Novo Evento</Button>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border p-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Cotação do Dólar (USD)</h3>
            <p className="text-sm text-muted-foreground">{loadingUsd ? "Atualizando..." : `Atualizado em ${usdRate.lastUpdate ? new Date(usdRate.lastUpdate).toLocaleTimeString('pt-BR') : 'N/A'}`}</p>
          </div>
          <Button onClick={fetchDollarRate} variant="ghost" size="sm" disabled={loadingUsd}><RefreshCw className={`h-4 w-4 mr-2 ${loadingUsd ? 'animate-spin' : ''}`} />Atualizar</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col items-center justify-center bg-accent p-4 rounded-lg">
                <p className="text-4xl font-bold text-foreground">R$ {parseFloat(usdRate.current).toFixed(3)}</p>
                <div className={`flex items-center gap-1 mt-1 ${usdRate.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {usdRate.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-semibold">{usdRate.change > 0 ? '+' : ''}{usdRate.change}% (7d)</span>
                </div>
            </div>
            <div className="relative h-40">
                {usdRate.history.length > 1 && (
                <svg width="100%" height="100%" viewBox={`0 0 ${usdRate.history.length -1} 100`}>
                    <motion.path d={`M ${usdRate.history.map((d, i) => `${i} ${100 - ((d.rate - minValue) / (maxValue - minValue)) * 100}`).join(" L ")}`} fill="none" stroke={usdRate.trend === 'up' ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} strokeWidth="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} />
                </svg>
                )}
                <div className="absolute top-0 left-0 text-xs text-muted-foreground">R$ {maxValue.toFixed(2)}</div>
                <div className="absolute bottom-0 left-0 text-xs text-muted-foreground">R$ {minValue.toFixed(2)}</div>
            </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-6 rounded-xl">
        <h3 className="text-lg font-semibold text-foreground mb-6">Eventos e Alertas de Mercado</h3>
        <div className="space-y-4">
          {loadingEvents ? ( <div className="text-center p-4">Carregando eventos...</div> ) : events.length === 0 ? ( <div className="text-center p-4 text-muted-foreground">Nenhum evento registrado.</div> ) :
          events.map((event, index) => (
            <motion.div key={event.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`border ${getImpactColor(event.impact_level)} p-4 rounded-lg`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-md ${getImpactColor(event.impact_level)}`}>{getEventIcon(event.event_type)}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">{event.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" /><span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(event)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEvent(event.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ExternalFactors;