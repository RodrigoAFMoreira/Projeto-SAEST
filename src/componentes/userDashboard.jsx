// Em uso em dashboard.jsx
// Componente para visualização do painel de funcionário

import React from 'react';
import { Bell } from 'lucide-react';

const roleDisplayNames = {
  user: 'Funcionário',
  gestor: 'Gestor de Segurança',
  administrador: 'Administrador',
};

const UserDashboard = ({ isSidebarMinimized, user }) => (
  <main className={`main-content ${isSidebarMinimized ? 'shifted-left' : ''}`}>
    <header className="main-header">
      <Bell />
    </header>
    <section className="details">
      <h2>Informações Pessoais</h2>
      <p>Bem-vindo, {user.nome || 'Usuário'}! Aqui você pode acessar suas informações pessoais, certificações e dados relacionados.</p>
      <p>Email: {user.email}</p>
      <p>Telefone: {user.telefone || 'Não informado'}</p>
      <p>Tipo: {roleDisplayNames[user.tipo] || 'Desconhecido'}</p>
    </section>
  </main>
);

export default UserDashboard;