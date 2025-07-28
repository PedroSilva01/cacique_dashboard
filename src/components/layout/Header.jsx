
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Bell, Search, DollarSign, ChevronDown, LogOut, Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const moduleNames = {
  '/': 'Dashboard',
  '/comparison': 'Comparação Detalhada',
  '/price-details': 'Detalhes de Preços',
  '/price-entry': 'Entrada de Preços',
  '/freight': 'Gestão de Fretes',
  '/stations': 'Gestão de Postos',
  '/external': 'Fatores Externos',
  '/analytics': 'Análises Avançadas',
  '/settings': 'Configurações',
  '/settings/users': 'Gerenciamento de Usuários'
};

const Header = ({ setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const activeModuleTitle = moduleNames[location.pathname] || 'Dashboard';
  const [usdRate, setUsdRate] = useState(null);
  const [oilPrice, setOilPrice] = useState(null);

  const fetchHeaderData = useCallback(async () => {
    try {
      // Fetch USD Rate
      const { data: usdData, error: usdError } = await supabase
        .from('dollar_rates')
        .select('sell_rate')
        .order('rate_date', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle empty results

      if (usdError) {
        console.error('Error fetching USD rate:', usdError);
        setUsdRate(null);
      } else {
        setUsdRate(usdData?.sell_rate || null);
      }

      // Fetch Oil Price
      try {
        const { data: oilData, error: oilError } = await supabase.functions.invoke('fetch-oil-price');
        if (oilError) {
          console.error('Error fetching oil price:', oilError);
          setOilPrice(null);
        } else {
          // A resposta da API está em oilData.data
          if (oilData?.data) {
            console.log('Oil price fetched successfully:', oilData.data);
            setOilPrice({
              price: oilData.data.price,
              formatted: oilData.data.formatted,
              currency: oilData.data.currency
            });
          } else {
            console.warn('No price data in response:', oilData);
            setOilPrice(null);
          }
        }
      } catch (oilError) {
        console.error('Exception in oil price fetch:', oilError);
        setOilPrice(null);
      }
    } catch (error) {
      console.error('Error in fetchHeaderData:', error);
      // Ensure we don't leave stale data on error
      setUsdRate(null);
      setOilPrice(null);
    }
  }, []);

  useEffect(() => {
    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchHeaderData]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    toast({ title: "Você saiu com sucesso." });
  };

  const handleNotificationClick = () => {
    toast({
      title: "🔔 Notificações",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  const handleSearchClick = () => {
    toast({
      title: "🔍 Busca",
      description: "🚧 Este recurso ainda não foi implementado—mas não se preocupe! Você pode solicitá-lo no seu próximo prompt! 🚀"
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border w-full">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-bold text-foreground sm:block hidden">
            {activeModuleTitle}
          </h1>
           <h1 className="text-lg font-bold text-foreground sm:hidden">
            {activeModuleTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {usdRate && (
            <motion.div whileHover={{ scale: 1.05 }} className="hidden sm:flex items-center gap-2 bg-accent px-3 py-1.5 rounded-md">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-foreground">{parseFloat(usdRate).toFixed(2)}</span>
            </motion.div>
          )}
          {oilPrice && (
            <motion.div whileHover={{ scale: 1.05 }} className="hidden sm:flex items-center gap-2 bg-accent px-3 py-1.5 rounded-md">
              <Droplet className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-foreground">
                {oilPrice.formatted || `$${oilPrice.price?.toFixed(2) || '0.00'}`}
              </span>
            </motion.div>
          )}

          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar..."
              className="w-full bg-accent rounded-md pl-10 pr-4 py-2 text-sm h-9 focus:outline-none focus:ring-2 focus:ring-primary/50"
              onFocus={handleSearchClick}
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className="relative text-muted-foreground hover:text-foreground"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-2 h-auto">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary to-violet-400 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-foreground">{profile ? getInitials(profile.full_name) : ''}</span>
                </div>
                <div className="hidden lg:flex flex-col items-start">
                  <span className="text-sm font-semibold text-foreground">{profile?.full_name || 'Usuário'}</span>
                  <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'Carregando...'}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden lg:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                Suporte
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
