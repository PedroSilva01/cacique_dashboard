
import React from 'react';
import { motion } from 'framer-motion';

const ComparisonMatrix = ({ matrix, loading }) => {
  if (loading) {
    return <div className="text-center p-8 text-muted-foreground">Carregando matriz...</div>;
  }

  const { rows, columns, data } = matrix;

  if (rows.length === 0 || columns.length === 0) {
    return <div className="text-center p-8 text-muted-foreground">Não há dados suficientes para exibir a matriz. Selecione uma base.</div>;
  }
  
  // Find the min price for highlighting
  const allPrices = Object.values(data).map(item => item.total);
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-xl overflow-x-auto"
    >
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-accent">
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground border-b border-r border-border">Companhia</th>
            {columns.map(col => (
              <th key={col} className="px-4 py-3 text-center font-semibold text-muted-foreground border-b border-border">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row} className="hover:bg-accent/50">
              <td className="px-4 py-3 font-semibold text-foreground border-r border-border">{row}</td>
              {columns.map(col => {
                const item = data[`${row}-${col}`];
                const isMinPrice = item && item.total === minPrice;
                return (
                  <td key={col} className={`px-4 py-3 text-center border-t border-border ${isMinPrice ? 'bg-green-500/20' : ''}`}>
                    {item ? (
                      <div className="flex flex-col">
                        <span className={`font-bold ${isMinPrice ? 'text-green-800' : 'text-foreground'}`}>R$ {item.total.toFixed(3)}</span>
                        <span className="text-xs text-muted-foreground">{item.paymentTerm}d</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
};

export default ComparisonMatrix;