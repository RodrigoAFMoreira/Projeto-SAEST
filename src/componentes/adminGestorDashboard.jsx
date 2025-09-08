// Em uso em dashboard.jsx
// Componente para visualização do painel de administração e gerente

import React from 'react';
import { LayoutDashboard, Building2, Building, ShieldCheck, Bell } from 'lucide-react';

const AdminGestorDashboard = ({ isSidebarMinimized }) => (
  <main className={`main-content admin-dashboard ${isSidebarMinimized ? 'shifted-left' : ''}`}>
    <header className="main-header">
      <Bell />
    </header>
    {/* Silenced stats section */}
    {/*
    <section className="stats-container">
      <div className="stat-card">
        <div className="stat-icon"><LayoutDashboard /></div>
        <div className="stat-content">
          <h3>Usuários</h3>
          <p>{counts.users}</p>
        </div>
      </div>
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
    */}
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
    <section className="section">
      <div className="section-header">
        <h2>Usuários</h2>
      </div>
      <div>
        <p>DataTable for usuarios to be implemented</p>
      </div>
    </section>
    {/* Silenced chart section */}
    {/*
    <ChartSection chartData={chartData} chartOptions={chartOptions} />
    */}
  </main>
);

export default AdminGestorDashboard;