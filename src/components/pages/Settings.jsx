
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Database, 
  Shield, 
  Users, 
  ChevronRight,
  Sun,
  Moon,
  Save,
  Trash2,
  Mail,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/components/theme-provider';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Estado para as configurações do usuário
  const [userSettings, setUserSettings] = useState({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      sounds: true,
    },
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');

  // Carrega as configurações salvas do usuário
  useEffect(() => {
    const loadSettings = async () => {
      if (!profile?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', profile.id)
          .single();
          
        if (error) throw error;
          
        if (data?.settings) {
          setUserSettings(prev => ({
            ...prev,
            ...data.settings
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível carregar suas configurações. Tente recarregar a página.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, [profile]);

  // Atualiza o tema quando o usuário alterar a configuração
  useEffect(() => {
    if (userSettings.theme && userSettings.theme !== 'system') {
      setTheme(userSettings.theme);
    }
  }, [userSettings.theme, setTheme]);
  
  // Atualiza a aba ativa com base no hash da URL
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash) {
      setActiveTab(hash);
    }
  }, [location]);

  // Salva as configurações no banco de dados
  const saveSettings = async () => {
    if (!profile?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: profile.id,
          settings: userSettings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          returning: 'minimal'
        });

      if (error) throw error;
      
      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências foram salvas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar suas configurações. Tente novamente.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Atualiza uma configuração específica
  const updateSetting = (key, value) => {
    setUserSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Atualiza uma configuração aninhada
  const updateNestedSetting = (parentKey, key, value) => {
    setUserSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [key]: value
      }
    }));
  };
  
  const handleTabChange = (value) => {
    setActiveTab(value);
    navigate(`#${value}`, { replace: true });
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

  // Renderiza o conteúdo da aba ativa
  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    switch(activeTab) {
      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Tema</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Escuro', icon: Moon },
                  { value: 'system', label: 'Sistema', icon: SettingsIcon }
                ].map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => updateSetting('theme', themeOption.value)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      userSettings.theme === themeOption.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <themeOption.icon className="h-6 w-6 mb-2" />
                    <span className="font-medium">{themeOption.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferências de Notificação</h3>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <Label htmlFor="email-notifications">Notificações por E-mail</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">Receba notificações importantes por e-mail</p>
                </div>
                <Switch 
                  id="email-notifications" 
                  checked={userSettings.notifications.email}
                  onCheckedChange={(checked) => updateNestedSetting('notifications', 'email', checked)}
                />
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Segurança da Conta</h3>
              
              <div className="space-y-2">
                <Label>Alterar Senha</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input type="password" placeholder="Nova senha" className="flex-1" />
                  <Input type="password" placeholder="Confirme a nova senha" className="flex-1" />
                  <Button>Atualizar Senha</Button>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Sessões Ativas</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Navegador Chrome</p>
                      <p className="text-sm text-muted-foreground">Windows 10 • Último acesso: 10 min atrás</p>
                    </div>
                    <Button variant="outline" size="sm">Encerrar Sessão</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">Dispositivo Atual</p>
                      <p className="text-sm text-muted-foreground">Windows 11 • Último acesso: Agora</p>
                    </div>
                    <span className="text-sm text-primary">Dispositivo Atual</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium text-destructive">Zona de Perigo</h3>
              
              <div className="p-4 border border-destructive/30 bg-destructive/5 rounded-lg">
                <h4 className="font-medium text-destructive">Excluir Conta</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.
                </p>
                <Button variant="destructive">Excluir Minha Conta</Button>
              </div>
            </div>
          </div>
        );
        
      case 'data':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Exportar Dados</h3>
              <p className="text-muted-foreground">
                Exporte todos os seus dados em um formato legível por máquina. Isso pode levar alguns minutos.
              </p>
              <Button variant="outline">
                <Database className="h-4 w-4 mr-2" />
                Solicitar Exportação de Dados
              </Button>
            </div>
            
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-medium">Limpar Dados</h3>
              <p className="text-muted-foreground">
                Remova permanentemente todos os seus dados do sistema. Esta ação não pode ser desfeita.
              </p>
              <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Todos os Meus Dados
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Configurações do Sistema</h3>
            <p className="text-muted-foreground">
              Selecione uma opção no menu à esquerda para começar a personalizar suas configurações.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-1">Personalize o sistema e gerencie o acesso dos usuários.</p>
          </div>
          <Button 
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Menu lateral */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="space-y-1">
            <button
              onClick={() => handleTabChange('appearance')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'appearance' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <SettingsIcon className="h-5 w-5" />
              <span>Aparência</span>
            </button>
            
            <button
              onClick={() => handleTabChange('notifications')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Bell className="h-5 w-5" />
              <span>Notificações</span>
            </button>
            
            <button
              onClick={() => handleTabChange('security')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'security' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Shield className="h-5 w-5" />
              <span>Segurança</span>
            </button>
            
            <button
              onClick={() => handleTabChange('data')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                activeTab === 'data' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Dados</span>
            </button>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
