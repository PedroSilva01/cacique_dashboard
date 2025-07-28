
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, Table, BarChart3, Grip, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ComparisonFilters from '@/components/comparison/ComparisonFilters';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonChart from '@/components/comparison/ComparisonChart';
import ComparisonMatrix from '@/components/comparison/ComparisonMatrix';
import { supabase } from '@/lib/customSupabaseClient';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const Comparison = () => {
  const [filters, setFilters] = useState({
    fuel: 'all',
    company: 'all',
    base: 'all',
    paymentTerm: 'all',
    isWhiteLabel: false,
  });
  const [viewMode, setViewMode] = useState('table');
  const [data, setData] = useState([]);
  const [matrixData, setMatrixData] = useState({ rows: [], columns: [], data: {} });
  const [loading, setLoading] = useState(true);
  const [bases, setBases] = useState([]);
  const [selectedMatrixBase, setSelectedMatrixBase] = useState('');

  const handleNoProductToggle = async (itemId, fuelName, hasProduct) => {
    const { data: entry, error: fetchError } = await supabase
      .from('price_entries')
      .select('id, fuels')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      toast({ title: "Erro ao buscar entrada", description: fetchError.message, variant: "destructive" });
      return;
    }

    const updatedFuels = entry.fuels.map(fuel => {
      if (fuel.name === fuelName) {
        return { ...fuel, has_product: hasProduct };
      }
      return fuel;
    });

    const { error: updateError } = await supabase
      .from('price_entries')
      .update({ fuels: updatedFuels, has_unavailable_product: updatedFuels.some(f => f.has_product === false) })
      .eq('id', itemId);

    if (updateError) {
      toast({ title: "Erro ao atualizar status do produto", description: updateError.message, variant: "destructive" });
    } else {
      toast({ title: "Status do produto atualizado!" });
      fetchData();
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('price_entries')
      .select(`
        id,
        entry_date,
        fuels,
        is_white_label,
        price_legends ( name ),
        companies ( id, name ),
        bases ( id, name )
      `);

    if (filters.company !== 'all') query = query.eq('company_id', filters.company);
    if (filters.base !== 'all' && viewMode !== 'matrix') query = query.eq('base_id', filters.base);
    if (filters.isWhiteLabel) query = query.eq('is_white_label', true);
    
    const { data: priceData, error } = await query.order('entry_date', { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar dados", description: error.message, variant: "destructive" });
      setData([]);
    } else {
      const flattenedData = priceData.flatMap(entry => 
        (entry.fuels || []).flatMap(fuel => 
          (fuel.prices || []).map(price => ({
            id: entry.id,
            fuel: fuel.name,
            hasProduct: fuel.has_product !== false, // default to true if undefined
            price: parseFloat(price.price) || 0,
            company: entry.companies?.name || 'Bandeira Branca',
            companyId: entry.companies?.id,
            base: entry.bases?.name || 'N/A',
            baseId: entry.bases?.id,
            paymentTerm: price.term,
            freight: 0.10, // Mocking freight
            total: (parseFloat(price.price) || 0) + 0.10,
            lastUpdate: new Date(entry.entry_date).toLocaleDateString()
          }))
        )
      );
      
      let filteredData = flattenedData;
      if (filters.fuel !== 'all') filteredData = flattenedData.filter(item => item.fuel.toLowerCase().includes(filters.fuel.toLowerCase()));
      if (filters.paymentTerm !== 'all') filteredData = filteredData.filter(item => item.paymentTerm.toString() === filters.paymentTerm.toString());
      setData(filteredData);
    }
    setLoading(false);
  }, [filters, viewMode]);

  const fetchBases = useCallback(async () => {
    const { data, error } = await supabase.from('bases').select('id, name');
    if (error) toast({ title: 'Erro ao buscar bases', variant: 'destructive' });
    else {
      setBases(data);
      if (data.length > 0 && !selectedMatrixBase) setSelectedMatrixBase(data[0].id);
    }
  }, [selectedMatrixBase]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchBases(); }, [fetchBases]);

  useEffect(() => {
    if (viewMode === 'matrix' && data.length > 0 && selectedMatrixBase) {
      const baseFilteredData = data.filter(d => d.baseId === selectedMatrixBase);
      const companies = [...new Set(baseFilteredData.map(item => item.company))].sort();
      const fuels = [...new Set(baseFilteredData.map(item => item.fuel))].sort();
      const matrix = {};
      baseFilteredData.forEach(item => {
        const key = `${item.company}-${item.fuel}`;
        if (!matrix[key] || item.total < matrix[key].total) matrix[key] = item;
      });
      setMatrixData({ rows: companies, columns: fuels, data: matrix });
    }
  }, [viewMode, data, selectedMatrixBase]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleExport = () => {
    if (data.length === 0) {
      toast({ title: "Nenhum dado para exportar", variant: "destructive" });
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...data.map(row => headers.map(header => `"${row[header]}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "comparativo_precos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exportação iniciada" });
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Comparação Detalhada</h1>
          <p className="text-muted-foreground mt-1">Análise comparativa de preços e condições.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}><RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />{loading ? 'Atualizando...' : 'Atualizar'}</Button>
          <Button onClick={handleExport} variant="default" size="sm"><Download className="h-4 w-4 mr-2" />Exportar</Button>
        </div>
      </motion.div>

      <ComparisonFilters filters={filters} onFilterChange={handleFilterChange} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Resultados</h2>
        <div className="flex items-center bg-accent p-1 rounded-md">
          <Button onClick={() => setViewMode('table')} variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" className="flex items-center gap-2"><Table className="h-4 w-4" />Tabela</Button>
          <Button onClick={() => setViewMode('matrix')} variant={viewMode === 'matrix' ? 'default' : 'ghost'} size="sm" className="flex items-center gap-2"><Grip className="h-4 w-4" />Matriz</Button>
          <Button onClick={() => setViewMode('chart')} variant={viewMode === 'chart' ? 'default' : 'ghost'} size="sm" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Gráfico</Button>
        </div>
      </motion.div>
      
      {viewMode === 'matrix' && (
        <div className="flex items-center gap-2">
            <Label htmlFor="matrix-base-select">Base de Carregamento:</Label>
            <select id="matrix-base-select" value={selectedMatrixBase} onChange={(e) => setSelectedMatrixBase(e.target.value)} className="bg-accent border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
              {bases.map(base => <option key={base.id} value={base.id}>{base.name}</option>)}
            </select>
        </div>
      )}

      <motion.div key={viewMode} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {viewMode === 'table' && <ComparisonTable data={data} loading={loading} onNoProductToggle={handleNoProductToggle} />}
        {viewMode === 'chart' && <ComparisonChart data={data} loading={loading} />}
        {viewMode === 'matrix' && <ComparisonMatrix matrix={matrixData} loading={loading} />}
      </motion.div>
    </div>
  );
};

export default Comparison;
