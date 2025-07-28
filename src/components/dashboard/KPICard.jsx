
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ title, value, change, trend, icon: Icon, color, onClick }) => {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    yellow: 'bg-yellow-500/10 text-yellow-600',
    gray: 'bg-gray-500/10 text-gray-600'
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="bg-card border border-border p-5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-1">
          {change !== 0 && (
            <>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-semibold ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            </>
          )}
        </div>
      </div>
      
      <div>
        <p className="text-muted-foreground text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </motion.div>
  );
};

export default KPICard;
