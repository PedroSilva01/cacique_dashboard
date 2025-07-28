
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, MapPin, Clock, CalendarDays, Ban } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ComparisonTable = ({ data, loading, onNoProductToggle }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'total', direction: 'ascending' });

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (item) => {
    if (!item.hasProduct) {
      toast({ title: "Produto indisponível", variant: "destructive" });
      return;
    }
    toast({
      title: "📋 Detalhes da Cotação",
      description: `Visualizando ${item.fuel} de ${item.company} por R$ ${item.total.toFixed(3)}`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-accent">
            <tr>
              {[
                { key: 'fuel', label: 'Combustível' },
                { key: 'company', label: 'Companhia' },
                { key: 'base', label: 'Base' },
                { key: 'paymentTerm', label: 'Prazo' },
                { key: 'total', label: 'Total' },
                { key: 'lastUpdate', label: 'Atualização' },
                { key: 'hasProduct', label: 'Disponível?' }
              ].map((column) => (
                <th key={column.key} className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  <Button variant="ghost" size="sm" onClick={() => requestSort(column.key)} className="flex items-center gap-2 -ml-3">
                    <span>{column.label}</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="7" className="text-center p-8 text-muted-foreground">Carregando...</td></tr>
            ) : sortedData.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-muted-foreground">Nenhum resultado encontrado.</td></tr>
            ) : (
              sortedData.map((item, index) => (
                <motion.tr
                  key={`${item.id}-${item.fuel}-${item.paymentTerm}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRowClick(item)}
                  className={`transition-colors ${!item.hasProduct ? 'bg-red-500/10 text-muted-foreground line-through' : 'hover:bg-accent cursor-pointer'}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        item.fuel.toLowerCase().includes('gasolina') ? 'bg-blue-500' :
                        item.fuel.toLowerCase().includes('diesel') ? 'bg-green-500' : 'bg-purple-500'
                      }`} />
                      <span className="font-medium text-current">{item.fuel}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.company}
                    {item.isWhiteLabel && <span className="ml-2 text-xs bg-primary/10 text-primary p-1 rounded">Branca</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /><span>{item.base}</span></div></td>
                  <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /><span>{item.paymentTerm} dias</span></div></td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold">R$ {item.total.toFixed(3)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /><span>{item.lastUpdate}</span></div></td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                      <Switch
                        id={`product-available-${item.id}-${item.fuel}`}
                        checked={item.hasProduct}
                        onCheckedChange={(checked) => onNoProductToggle(item.id, item.fuel, checked)}
                        aria-label="Produto disponível"
                      />
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default ComparisonTable;
