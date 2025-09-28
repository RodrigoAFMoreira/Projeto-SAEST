// Em uso em dashboard.jsx
// Componente para visualização do painel de funcionário

import { Bell } from 'lucide-react';
import TipoUser from './TipoUser';

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
      <p>Tipo: <TipoUser userType={user.tipo} /></p>
    </section>
  </main>
);

export default UserDashboard;