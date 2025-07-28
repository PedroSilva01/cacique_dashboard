
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Trash2, Save, Edit, X, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { supabase } from '@/lib/customSupabaseClient';

const PriceEntry = () => {
  const [legend, setLegend] = useState('');
  const [selectedLegendId, setSelectedLegendId] = useState(null);
  const [fuels, setFuels] = useState([{ name: '', prices: [{ term: '', price: '' }], has_product: true }]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [entries, setEntries] = useState([]);
  const [legends, setLegends] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [bases, setBases] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedBaseId, setSelectedBaseId] = useState('');
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [popoverOpen, setPopoverOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    const [legendsRes, entriesRes, companiesRes, basesRes] = await Promise.all([
      supabase.from('price_legends').select('id, name'),
      supabase.from('price_entries').select(`id, entry_date, fuels, legend_id, company_id, base_id, is_white_label, has_unavailable_product, price_legends ( name ), companies ( name ), bases ( name )`).order('entry_date', { ascending: false }),
      supabase.from('companies').select('id, name'),
      supabase.from('bases').select('id, name')
    ]);

    if (legendsRes.error) toast({ title: "Erro ao buscar legendas", description: legendsRes.error.message, variant: "destructive" });
    else setLegends(legendsRes.data || []);

    if (entriesRes.error) toast({ title: "Erro ao buscar entradas", description: entriesRes.error.message, variant: "destructive" });
    else {
      const formattedEntries = (entriesRes.data || []).map(entry => ({
        id: entry.id,
        legend: entry.price_legends?.name || 'N/A',
        company: entry.companies?.name || 'N/A',
        base: entry.bases?.name || 'N/A',
        legend_id: entry.legend_id,
        company_id: entry.company_id,
        base_id: entry.base_id,
        is_white_label: entry.is_white_label,
        date: entry.entry_date,
        fuels: entry.fuels || [],
      }));
      setEntries(formattedEntries);
    }

    if (companiesRes.error) toast({ title: "Erro ao buscar companhias", description: companiesRes.error.message, variant: "destructive" });
    else setCompanies(companiesRes.data || []);

    if (basesRes.error) toast({ title: "Erro ao buscar bases", description: basesRes.error.message, variant: "destructive" });
    else setBases(basesRes.data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFuelChange = (fuelIndex, field, value) => {
    const newFuels = [...fuels];
    newFuels[fuelIndex][field] = value;
    setFuels(newFuels);
  };
  
  const handlePriceChange = (fuelIndex, priceIndex, field, value) => {
    const newFuels = [...fuels];
    newFuels[fuelIndex].prices[priceIndex][field] = value;
    setFuels(newFuels);
  };

  const handleAddPrice = (fuelIndex) => {
    const newFuels = [...fuels];
    newFuels[fuelIndex].prices.push({ term: '', price: '' });
    setFuels(newFuels);
  };

  const handleRemovePrice = (fuelIndex, priceIndex) => {
    const newFuels = [...fuels];
    newFuels[fuelIndex].prices = newFuels[fuelIndex].prices.filter((_, i) => i !== priceIndex);
    setFuels(newFuels);
  };
  
  const handleAddFuel = () => setFuels([...fuels, { name: '', prices: [{ term: '', price: '' }], has_product: true }]);
  const handleRemoveFuel = (index) => setFuels(fuels.filter((_, i) => i !== index));

  const resetForm = () => {
    setLegend('');
    setSelectedLegendId(null);
    setSelectedCompanyId('');
    setSelectedBaseId('');
    setFuels([{ name: '', prices: [{ term: '', price: '' }], has_product: true }]);
    setDate(new Date().toISOString().slice(0, 10));
    setIsWhiteLabel(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!legend.trim() || !selectedCompanyId || !selectedBaseId || fuels.some(f => !f.name.trim() || (f.has_product && f.prices.some(p => !p.price || !p.term)))) {
      toast({ title: "Erro de Validação", description: "Por favor, preencha todos os campos obrigatórios. Se um produto está disponível, ele deve ter ao menos um preço e prazo.", variant: "destructive" });
      return;
    }

    let legendId = selectedLegendId;
    if (!legendId) {
      const { data, error } = await supabase.from('price_legends').insert({ name: legend.trim() }).select('id').single();
      if (error) {
        toast({ title: "Erro ao salvar legenda", description: error.message, variant: "destructive" });
        return;
      }
      legendId = data.id;
    }

    const entryData = { 
      legend_id: legendId, 
      company_id: selectedCompanyId, 
      base_id: selectedBaseId, 
      entry_date: date, 
      fuels, 
      is_white_label: isWhiteLabel,
      has_unavailable_product: fuels.some(f => f.has_product === false)
    };

    const { error } = editingId
      ? await supabase.from('price_entries').update(entryData).eq('id', editingId)
      : await supabase.from('price_entries').insert(entryData);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: `Preços para "${legend}" foram salvos.` });
      await fetchInitialData();
      resetForm();
    }
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setLegend(entry.legend);
    setSelectedLegendId(entry.legend_id);
    setSelectedCompanyId(entry.company_id);
    setSelectedBaseId(entry.base_id);
    setDate(entry.date);
    setFuels((entry.fuels || []).map(f => ({...f, has_product: f.has_product !== false }))); // Ensure default true
    setIsWhiteLabel(entry.is_white_label);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('price_entries').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído!", description: "A entrada de preço foi removida." });
      await fetchInitialData();
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Entrada de Preços</h1>
        <p className="text-muted-foreground mt-1">{editingId ? 'Editando' : 'Adicione novos'} preços de combustíveis.</p>
      </motion.div>

      <motion.form onSubmit={handleSubmit} className="bg-card border border-border p-6 rounded-xl space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div>
            <Label>Legenda</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between mt-2">
                  {legend || "Selecione ou crie..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar ou criar legenda..." value={legend} onValueChange={setLegend} />
                  <CommandEmpty>Nenhuma legenda. Crie uma nova.</CommandEmpty>
                  <CommandGroup>
                    {legends.map((item) => (
                      <CommandItem key={item.id} value={item.name} onSelect={(val) => {
                        const sel = legends.find(l => l.name.toLowerCase() === val.toLowerCase());
                        setLegend(sel ? sel.name : val);
                        setSelectedLegendId(sel ? sel.id : null);
                        setPopoverOpen(false);
                      }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedLegendId === item.id ? "opacity-100" : "opacity-0")} />
                        {item.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label>Companhia</Label>
            <select onChange={(e) => setSelectedCompanyId(e.target.value)} value={selectedCompanyId} className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Base</Label>
            <select onChange={(e) => setSelectedBaseId(e.target.value)} value={selectedBaseId} className="w-full mt-2 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">Selecione</option>
              {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="white-label" checked={isWhiteLabel} onCheckedChange={setIsWhiteLabel} />
            <Label htmlFor="white-label">Bandeira Branca?</Label>
          </div>
        </div>
        
        <div className="space-y-6 pt-4 border-t border-border">
          {fuels.map((fuel, fuelIndex) => (
            <div key={fuelIndex} className="bg-accent p-4 rounded-lg space-y-4">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Label>Combustível</Label>
                  <Input placeholder="Ex: Gasolina Comum" value={fuel.name} onChange={(e) => handleFuelChange(fuelIndex, 'name', e.target.value)} />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Label htmlFor={`available-${fuelIndex}`} className="text-sm">Disponível?</Label>
                  <Switch id={`available-${fuelIndex}`} checked={fuel.has_product} onCheckedChange={(checked) => handleFuelChange(fuelIndex, 'has_product', checked)} />
                </div>
                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveFuel(fuelIndex)} disabled={fuels.length === 1}><Trash2 className="h-4 w-4" /></Button>
              </div>
              
              {fuel.has_product && (fuel.prices || []).map((price, priceIndex) => (
                <motion.div key={priceIndex} className="flex items-end gap-4 pl-4 border-l-2 border-primary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex-1"><Label className="text-xs text-muted-foreground">Prazo (dias)</Label><Input type="number" placeholder="Ex: 7" value={price.term} onChange={e => handlePriceChange(fuelIndex, priceIndex, 'term', e.target.value)} /></div>
                  <div className="flex-1"><Label className="text-xs text-muted-foreground">Preço (R$)</Label><Input type="number" step="0.001" placeholder="Ex: 5.499" value={price.price} onChange={e => handlePriceChange(fuelIndex, priceIndex, 'price', e.target.value)} /></div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePrice(fuelIndex, priceIndex)} disabled={fuel.prices.length === 1}><X className="h-4 w-4 text-destructive" /></Button>
                </motion.div>
              ))}
              {fuel.has_product && <Button type="button" variant="link" onClick={() => handleAddPrice(fuelIndex)}><PlusCircle className="h-4 w-4 mr-2" />Adicionar Prazo/Preço</Button>}
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={handleAddFuel}><PlusCircle className="h-4 w-4 mr-2" />Adicionar Combustível</Button>
          <div className="flex gap-4 items-center">
            <div>
              <Label>Data da Entrada</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            {editingId && <Button type="button" variant="ghost" onClick={resetForm}><X className="h-4 w-4 mr-2" />Cancelar</Button>}
            <Button type="submit" size="lg"><Save className="h-4 w-4 mr-2" />{editingId ? 'Atualizar' : 'Salvar'}</Button>
          </div>
        </div>
      </motion.form>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Histórico de Entradas</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent">
                <tr>
                  <th className="px-4 py-3 text-left">Legenda</th>
                  <th className="px-4 py-3 text-left">Companhia</th>
                  <th className="px-4 py-3 text-left">Base</th>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Preços</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
                ) : entries.length > 0 ? entries.map((entry) => (
                  <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-4 py-3 font-medium">{entry.legend} {entry.is_white_label && <span className="text-xs bg-primary/10 text-primary p-1 rounded">Branca</span>}</td>
                    <td className="px-4 py-3">{entry.company}</td>
                    <td className="px-4 py-3">{entry.base}</td>
                    <td className="px-4 py-3">{new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{(entry.fuels || []).map(f => `${f.name}: ${f.has_product === false ? 'Sem Produto' : (f.prices || []).map(p => `R$ ${parseFloat(p.price).toFixed(3)} (${p.term}d)`).join(', ')}`).join(' | ')}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="icon" onClick={() => handleEdit(entry)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(entry.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </motion.tr>
                )) : (
                  <tr><td colSpan="6" className="text-center py-8 text-muted-foreground">Nenhuma entrada encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceEntry;
