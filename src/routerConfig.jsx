import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import supabase from './config/supabaseClient';
import Login from './login';
import Cadastro from './cadastro';
import EsqueciSenha from './esqueciSenha';
import VerificarEmail from './verificarEmail';
import Layout from './layout';
import Dashboard from './dashboard';
import Informacoes from './informacoes';
import './index.css';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute location:', location.pathname, location.hash);
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, [location]);

  if (isAuthenticated === null) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const location = useLocation();
  useEffect(() => {
    console.log('AppRoutes location:', location.pathname, location.hash);
  }, [location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/verificar-email" element={<VerificarEmail />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/menu" element={<Dashboard />} />
          <Route path="/informacoes" element={<Informacoes />} />
        </Route>
      </Route>
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