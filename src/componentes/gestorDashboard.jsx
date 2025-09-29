// Em uso em dashboard.jsx
// Componente de dashboard para gestores

import { Bell, Building2, Building, ShieldCheck } from 'lucide-react';
import '../css/adminDash.css';

const GestorDashboard = ({ isSidebarMinimized, counts }) => (
  <main className={`main-content gestor-dashboard ${isSidebarMinimized ? 'shifted-left' : ''}`}>
    <header className="main-header">
      <Bell />
    </header>
    <section className="stats-container">
      <div className="stat-card">
        <div className="stat-icon"><Building /></div>
        <div className="stat-content">
          <h3>Construtoras</h3>
          <p>{counts.empresas}</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><Building2 /></div>
        <div className="stat-content">
          <h3>Obras</h3>
          <p>{counts.obras}</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><ShieldCheck /></div>
        <div className="stat-content">
          <h3>EPIs</h3>
          <p>{counts.epis}</p>
        </div>
      </div>
    </section>
    <section className="section">
      <div className="section-header">
        <h2>Construtoras</h2>
      </div>
      <p>EmpresasTable component to be implemented</p>
    </section>
    <section className="section">
      <div className="section-header">
        <h2>Obras</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Endereço</th>
            <th>Responsável</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan="4">DataTable for obras to be implemented</td></tr>
        </tbody>
      </table>
    </section>
    <section className="section">
      <div className="section-header">
        <h2>EPIs</h2>
      </div>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Obra</th>
            <th>Qtd</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan="5">DataTable for epis to be implemented</td></tr>
        </tbody>
      </table>
    </section>
  </main>
);

export default GestorDashboard;