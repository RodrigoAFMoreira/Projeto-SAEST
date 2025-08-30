// src/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { LayoutDashboard, Building2, CalendarClock, FileText, Settings, HelpCircle, Bell, Home, Building, File, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from "./Sidebar";
//import EmpresasTable from "./EmpresasTable";
//import DataTable from "./DataTable";
import './css/dashboard.css';
import './css/menuEsquerdo.css';
import './css/menu.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const formatCriadoEm = (date) => {
  if (date) {
    return new Date(date).toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/Sao_Paulo',
      timeZoneName: 'short',
    }).replace(' às', ' às');
  }
  return 'Data não disponível';
};

const roleDisplayNames = {
  user: 'Funcionário',
  gestor: 'Gestor de Segurança',
  administrador: 'Administrador',
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'user' });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log('Usuário não está logado, redirecionando para login');
        navigate('/login');
        return;
      }
      console.log('Usuário logado:', user.id, user.email);
      setUser(user);

      const { data, error: userError } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
      if (userError || !data) {
        console.warn('Documento do usuário não encontrado, usando padrão user');
        setUserData({ tipo: 'user' });
      } else {
        setUserData(data);
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [users, empresas, obras, epis] = await Promise.all([
          supabase.from('usuarios').select('id', { count: 'exact' }),
          supabase.from('empresas').select('id', { count: 'exact' }),
          supabase.from('obras').select('id', { count: 'exact' }),
          supabase.from('epis').select('id', { count: 'exact' }),
        ]);
        setTimeout(() => {
          const usersList = document.getElementById('users-list');
          const empresasList = document.getElementById('empresas-list');
          const obrasList = document.getElementById('obras-list');
          const episList = document.getElementById('epis-list');
          if (usersList) usersList.textContent = users.count || 0;
          if (empresasList) empresasList.textContent = empresas.count || 0;
          if (obrasList) obrasList.textContent = obras.count || 0;
          if (episList) episList.textContent = epis.count || 0;
          document.querySelectorAll('.change-text').forEach((el) => {
            if (el) el.textContent = `${Math.floor(Math.random() * 15) + 5}% no último mês`;
          });
        }, 800);
      } catch (error) {
        console.error('Erro ao carregar contadores:', error.message);
      }
    };
    if (userData.tipo !== 'user') fetchCounts(); //so para admin/gestor!!!!
  }, [userData.tipo]);

  const chartData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Obras',
        data: [12000, 8000, 10000, 15000, 13000, 16000, 19000],
        borderColor: '#1e3a8a',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (val) => val / 1000 + 'K' },
      },
    },
  };

  const renderAdminGestorContent = () => (
    <main className={`main-content admin-dashboard ${isSidebarMinimized ? 'shifted-left' : ''}`}>
      <header className="main-header">
        <Bell />
      </header>
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-icon"><LayoutDashboard /></div>
          <div className="stat-content">
            <h3>Usuários</h3>
            <p id="users-list">0</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Building /></div>
          <div className="stat-content">
            <h3>Construtoras</h3>
            <p id="empresas-list">0</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Building2 /></div>
          <div className="stat-content">
            <h3>Obras</h3>
            <p id="obras-list">0</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShieldCheck /></div>
          <div className="stat-content">
            <h3>EPIs</h3>
            <p id="epis-list">0</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Construtoras</h2>
        </div>
        <EmpresasTable />
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
          <tbody id="obras-details-list">
            <DataTable collectionName="obras" listId="obras-details-list" userType={userData.tipo} />
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
          <tbody id="epis-details-list">
            <DataTable collectionName="epis" listId="epis-details-list" userType={userData.tipo} />
          </tbody>
        </table>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Usuários</h2>
        </div>
        <div id="users-details-list">
          <DataTable collectionName="usuarios" listId="users-details-list" userType={userData.tipo} />
        </div>
      </section>
      <section className="grafico">
        <h3>Obras</h3>
        <Line data={chartData} options={chartOptions} />
      </section>
    </main>
  );

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  return (
    <div className="container">
      {user && (
        <>
          <Sidebar userType={userData.tipo} userEmail={user.email} isMinimized={isSidebarMinimized} onToggle={handleToggleSidebar} />
          {userData.tipo === 'user' ? (
            <main className={`main-content ${isSidebarMinimized ? 'shifted-left' : ''}`}>
              <header className="main-header">
                <Bell />
              </header>
              <section className="details">
                <h2>Informações Pessoais</h2>
                <p>Bem-vindo! Aqui você pode acessar suas informações pessoais, certificações e dados relacionados.</p>
              </section>
            </main>
          ) : (
            renderAdminGestorContent()
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;