import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const AlertsPanel = ({ alerts }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const handleAlertClick = (alert) => {
    toast({
      title: "🚨 Detalhes do Alerta",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  const handleViewAllAlerts = () => {
    toast({
      title: "📋 Todos os Alertas",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border p-6 rounded-xl"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Alertas e Notificações</h3>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real</p>
        </div>
        
        <Button
          onClick={handleViewAllAlerts}
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
        >
          Ver todos
        </Button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleAlertClick(alert)}
            className={`border ${getAlertColor(alert.type)} p-4 rounded-lg cursor-pointer hover:bg-accent transition-colors`}
          >
            <div className="flex items-start gap-4">
              {getAlertIcon(alert.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {alert.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">há {alert.time}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {alerts.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
            <Info className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-muted-foreground">Nenhum alerta no momento.</p>
          <p className="text-sm text-muted-foreground mt-1">Sistema funcionando normalmente.</p>
        </div>
      )}
    </motion.div>
  );
};

export default AlertsPanel;