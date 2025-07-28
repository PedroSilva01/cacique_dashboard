
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ComparisonFilters = ({ filters, onFilterChange }) => {
  const [companies, setCompanies] = useState([]);
  const [bases, setBases] = useState([]);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data: companiesData, error: companiesError } = await supabase.from('companies').select('id, name');
      if (companiesError) toast({ title: "Erro ao buscar companhias", variant: "destructive" });
      else setCompanies(companiesData);

      const { data: basesData, error: basesError } = await supabase.from('bases').select('id, name');
      if (basesError) toast({ title: "Erro ao buscar bases", variant: "destructive" });
      else setBases(basesData);
    };
    fetchFilterOptions();
  }, []);

  const filterOptions = {
    fuel: [
      { value: 'all', label: 'Todos Combustíveis' },
      { value: 'gasolina', label: 'Gasolina' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'etanol', label: 'Etanol' }
    ],
    company: [
      { value: 'all', label: 'Todas Companhias' },
      ...companies.map(c => ({ value: c.id, label: c.name }))
    ],
    base: [
      { value: 'all', label: 'Todas as Bases' },
      ...bases.map(b => ({ value: b.id, label: b.name }))
    ],
    paymentTerm: [
      { value: 'all', label: 'Todos os Prazos' },
      { value: '1', label: '1 dia' },
      { value: '7', label: '7 dias' },
      { value: '13', label: '13 dias' },
      { value: '15', label: '15 dias' },
    ],
  };

  const appliedFiltersCount = Object.entries(filters).filter(([key, value]) => (value !== 'all' && value !== false)).length;

  const clearFilters = () => {
    onFilterChange('fuel', 'all');
    onFilterChange('company', 'all');
    onFilterChange('base', 'all');
    onFilterChange('paymentTerm', 'all');
    onFilterChange('isWhiteLabel', false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border p-4 rounded-xl"
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>
        
        {Object.entries(filterOptions).map(([key, options]) => (
          <div key={key}>
            <select
              aria-label={`Filtrar por ${key}`}
              value={filters[key]}
              onChange={(e) => onFilterChange(key, e.target.value)}
              className="w-full bg-accent border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        
        <div className="flex items-center space-x-2">
            <Switch id="white-label-filter" checked={filters.isWhiteLabel} onCheckedChange={(checked) => onFilterChange('isWhiteLabel', checked)} />
            <Label htmlFor="white-label-filter">Apenas Bandeira Branca</Label>
        </div>

        {appliedFiltersCount > 0 && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar ({appliedFiltersCount})
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ComparisonFilters;