import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import supabase from './supabaseClient';
import Login from '../login';
import Cadastro from '../cadastro';
import EsqueciSenha from '../esqueciSenha';
import VerificarEmail from '../verificarEmail';
import Layout from '../componentes/layout';
import Dashboard from '../dashboard';
import Informacoes from '../informacoes';
import Configuracoes from '../configuracao';
import Epi from '../epi';
import Carregando from '../componentes/carregando'; 
import '../css/index.css';


const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    // Initial check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    // Cleanup listener on unmount
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []); // No location dependency to avoid repeated checks

  if (isAuthenticated === null) {
    return <Carregando />; // Use Carregando component instead of LoadingSpinner
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

const AppRoutes = () => {
  // Removed console.log for production
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/verificar-email" element={<VerificarEmail />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/menu" element={<Dashboard />} />
          <Route path="/informacoes" element={<Informacoes />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/epis" element={<Epi />} /> {/* Route for Epi.jsx */}
        </Route>
      </Route>
      
      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

const RouterConfig = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default RouterConfig;