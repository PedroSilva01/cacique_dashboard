
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitCompare, Truck, MapPin, TrendingUp, PieChart, Settings, Tags, X, Fuel, ClipboardX as ClipboardPen, LogOut, Building, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from '@/components/ui/use-toast';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/comparison', label: 'Comparação', icon: GitCompare },
  { path: '/price-entry', label: 'Entrada de Preços', icon: ClipboardPen },
  { path: '/external', label: 'Fatores Externos', icon: TrendingUp },
  { path: '/analytics', label: 'Análises', icon: PieChart },
];

const managementMenuItems = [
  { path: '/companies', label: 'Companhias', icon: Building },
  { path: '/bases', label: 'Bases', icon: Warehouse },
  { path: '/stations', label: 'Postos', icon: MapPin },
  { path: '/freight', label: 'Fretes', icon: Truck },
  { path: '/price-details', label: 'Legendas', icon: Tags },
];

const SidebarContent = ({ setSidebarOpen }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
    toast({ title: "Você saiu com sucesso." });
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
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border h-16">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg">
            <Fuel className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">Abastece</span>
            <p className="text-xs text-muted-foreground">Painel Estratégico</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Análise</p>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <p className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gerenciamento</p>
        {managementMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto space-y-2 border-t border-border">
        <NavLink
            to="/settings"
            onClick={() => setSidebarOpen && setSidebarOpen(false)}
            className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>Configurações</span>
        </NavLink>
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 text-muted-foreground hover:text-destructive">
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </Button>
        <div className="bg-accent rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-violet-400 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-primary-foreground">{profile ? getInitials(profile.full_name) : ''}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.full_name || 'Usuário'}</p>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role || 'Online'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: "-100%" },
  };

  return (
    <>
      <div className="lg:hidden">
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <motion.aside
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                transition={{ type: "spring", damping: 25, stiffness: 180 }}
                className="fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border"
              >
                <SidebarContent setSidebarOpen={setSidebarOpen} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </div>

      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-card border-r border-border">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;
