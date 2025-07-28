
import React from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, User, Bell, Database, Shield, Users, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Settings = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleSaveSettings = () => {
    toast({
      title: "🚧 Funcionalidade em Desenvolvimento",
      description: "A personalização de configurações ainda não foi implementada. Você pode solicitar no próximo prompt!"
    });
  };

  const settingSections = [
    {
      id: 'account', title: 'Conta', icon: User, description: 'Gerencie seu perfil e segurança.',
      items: [
        { label: 'Gerenciamento de Usuários', path: '/settings/users', role: 'owner', icon: Users },
        { label: 'Segurança da Conta', path: '#', icon: Shield },
      ]
    },
    {
      id: 'system', title: 'Sistema', icon: SettingsIcon, description: 'Personalize a interface e notificações.',
      items: [
        { label: 'Notificações', path: '#', icon: Bell },
        { label: 'Gerenciamento de Dados', path: '#', icon: Database },
      ]
    }
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize o sistema e gerencie o acesso dos usuários.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {settingSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="bg-card border border-border p-6 rounded-xl flex flex-col"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 text-primary rounded-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>

              <div className="space-y-3 flex-grow">
                {section.items.map((item) => {
                  if (item.role && item.role !== profile?.role) {
                    return null;
                  }
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.path === '#' ? handleSaveSettings() : navigate(item.path)}
                      className="w-full flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-primary/10 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <ItemIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
