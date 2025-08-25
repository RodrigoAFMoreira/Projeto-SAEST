import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./login";
import Cadastro from "./cadastro";
import EsqueciSenha from "./esqueciSenha";

const RouterConfig = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/menu" element={<div>Menu Page</div>} />
        <Route path="/esqueciSenha" element={<EsqueciSenha />} />
        <Route path="/verificar-email" element={<div>Verificar Email Page</div>} />
        <Route path="*" element={<Navigate to="/login" replace />} /> 
      </Routes>
    </Router>
  );
};

export default RouterConfig;