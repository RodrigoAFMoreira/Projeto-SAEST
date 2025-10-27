// Elementos de roteamento e proteção de rotas usando React Router e Supabase
// src/config/routerConfig.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import supabase from './supabaseClient';
import Login from '../login';
//import Cadastro from '../cadastro'; old
//import EsqueciSenha from '../esqueciSenha';
//import VerificarEmail from '../verificarEmail'; old 
import Layout from '../componentes/layout';
import Dashboard from '../dashboard';
import Informacao from '../informacao';
import Configuracoes from '../configuracao';
import Epi from '../epi';
import Carregando from '../componentes/carregando';
import Empresa from '../empresa';
import Obra from '../obra';
import Certifications from '../certificacaoUser';
//import BuscaObras from '../buscaObra'; old 

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  if (isAuthenticated === null) {
    return <Carregando />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Navigate to="/cadastro.html" replace />} />
      <Route path="/esqueci-senha" element={<Navigate to="/esqueciSenha.html" replace />} />
      <Route path="/verificar-email" element={<Navigate to="/verificarEmail.html" replace />} />
      
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/menu" element={<Dashboard />} />
          <Route path="/construtoras" element={<Empresa />} />
          <Route path="/obras" element={<Obra />} />
          <Route path="/certificacoes" element={<Certifications />} />
          <Route path="/epis" element={<Epi />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/informacoes" element={<Informacao />} />
          <Route path="/busca-obras" element={<Dashboard />} /> 
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