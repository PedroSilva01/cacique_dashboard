import React from 'react';
import { motion } from 'framer-motion';
import { Tags, DollarSign, Truck, Percent, FileText, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const PriceDetails = () => {
  const priceData = [
    {
      id: 1,
      fuel: 'Gasolina Comum',
      company: 'Vibra',
      base: 'Fortaleza (CE)',
      basePrice: 5.10,
      freight: 0.08,
      taxes: 0.22,
      total: 5.40,
      history: [5.42, 5.41, 5.45, 5.40]
    },
    {
      id: 2,
      fuel: 'Diesel S10',
      company: 'Ipiranga',
      base: 'Suape (PE)',
      basePrice: 4.65,
      freight: 0.12,
      taxes: 0.14,
      total: 4.91,
      history: [4.88, 4.89, 4.90, 4.91]
    },
    {
      id: 3,
      fuel: 'Etanol Hidratado',
      company: 'Shell',
      base: 'São Luís (MA)',
      basePrice: 3.40,
      freight: 0.05,
      taxes: 0.22,
      total: 3.67,
      history: [3.70, 3.68, 3.66, 3.67]
    },
    {
      id: 4,
      fuel: 'Gasolina Aditivada',
      company: 'Atem',
      base: 'Teresina (PI)',
      basePrice: 5.25,
      freight: 0.07,
      taxes: 0.23,
      total: 5.55,
      history: [5.50, 5.52, 5.54, 5.55]
    }
  ];

  const handleSort = (column) => {
    toast({
      title: "🔄 Ordenação",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  const handleViewHistory = (item) => {
    toast({
      title: "📜 Ver Histórico",
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
          <h1 className="text-3xl font-bold text-foreground">Detalhes de Preços</h1>
          <p className="text-muted-foreground mt-1">Análise detalhada da composição de custos.</p>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent">
              <tr>
                {[
                  { key: 'fuel', label: 'Combustível / Companhia', icon: Tags },
                  { key: 'basePrice', label: 'Preço Base', icon: DollarSign },
                  { key: 'freight', label: 'Frete', icon: Truck },
                  { key: 'taxes', label: 'Impostos', icon: Percent },
                  { key: 'total', label: 'Preço Final', icon: DollarSign },
                  { key: 'history', label: 'Histórico (Últimos 4 dias)', icon: FileText }
                ].map((column) => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left font-semibold text-muted-foreground"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 -ml-3"
                    >
                      <column.icon className="h-4 w-4" />
                      <span>{column.label}</span>
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {priceData.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-accent transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-semibold text-foreground">{item.fuel}</p>
                    <p className="text-muted-foreground">{item.company} - {item.base}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    R$ {item.basePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    R$ {item.freight.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    R$ {item.taxes.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-foreground font-bold text-lg">
                    R$ {item.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {item.history.map((price, i) => (
                          <div key={i} className="flex items-center justify-center w-8 h-8 text-xs font-bold text-primary-foreground bg-primary/70 rounded-full border-2 border-card">
                            {price > item.history[i-1] ? '▲' : '▼'}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleViewHistory(item)}
                        className="p-0 h-auto text-primary"
                      >
                        Ver mais
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default PriceDetails;