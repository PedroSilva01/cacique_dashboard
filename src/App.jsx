
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/toaster';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/pages/Dashboard';
import Comparison from '@/components/pages/Comparison';
import PriceDetails from '@/components/pages/PriceDetails';
import FreightManagement from '@/components/pages/FreightManagement';
import StationManagement from '@/components/pages/StationManagement';
import ExternalFactors from '@/components/pages/ExternalFactors';
import Analytics from '@/components/pages/Analytics';
import Settings from '@/components/pages/Settings';
import PriceEntry from '@/components/pages/PriceEntry';
import LoginPage from '@/components/pages/LoginPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import UserManagement from '@/components/pages/UserManagement';
import BaseManagement from '@/components/pages/BaseManagement';
import CompanyManagement from '@/components/pages/CompanyManagement';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const PrivateRoute = ({ children }) => {
  const { session, loading } = useAuth();
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-secondary"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen bg-secondary"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <>
      <Helmet>
        <title>Painel Estratégico de Abastecimento</title>
        <meta name="description" content="Sistema completo para gestão estratégica de abastecimento de combustíveis com análise de preços, fretes e comparativos em tempo real." />
      </Helmet>

      <div className="min-h-screen bg-secondary text-foreground">
        {session && <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
        
        <div className={`flex flex-col transition-all duration-300 ${session ? 'lg:ml-64' : ''}`}>
          {session && <Header setSidebarOpen={setSidebarOpen} />}
          
          <main className="flex-1 p-4 lg:p-8">
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<PrivateRoute><PageWrapper><Dashboard /></PageWrapper></PrivateRoute>} />
                <Route path="/comparison" element={<PrivateRoute><PageWrapper><Comparison /></PageWrapper></PrivateRoute>} />
                <Route path="/price-details" element={<PrivateRoute><PageWrapper><PriceDetails /></PageWrapper></PrivateRoute>} />
                <Route path="/price-entry" element={<PrivateRoute><PageWrapper><PriceEntry /></PageWrapper></PrivateRoute>} />
                <Route path="/freight" element={<PrivateRoute><PageWrapper><FreightManagement /></PageWrapper></PrivateRoute>} />
                <Route path="/stations" element={<PrivateRoute><PageWrapper><StationManagement /></PageWrapper></PrivateRoute>} />
                <Route path="/bases" element={<PrivateRoute><PageWrapper><BaseManagement /></PageWrapper></PrivateRoute>} />
                <Route path="/companies" element={<PrivateRoute><PageWrapper><CompanyManagement /></PageWrapper></PrivateRoute>} />
                <Route path="/external" element={<PrivateRoute><PageWrapper><ExternalFactors /></PageWrapper></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute><PageWrapper><Analytics /></PageWrapper></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><PageWrapper><Settings /></PageWrapper></PrivateRoute>} />
                <Route path="/settings/users" element={<PrivateRoute><PageWrapper><UserManagement /></PageWrapper></PrivateRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
        
        <Toaster />
      </div>
    </>
  );
}

export default App;
