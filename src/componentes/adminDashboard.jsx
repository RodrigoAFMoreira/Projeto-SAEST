// Em uso em dashboard.jsx
// Componente de dashboard para administradores

import React, { useState, useEffect } from 'react';
import { Bell, Building2, Building, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import supabase from '../config/supabaseClient';
import '../css/adminDash.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = ({ isSidebarMinimized, counts, userId }) => {
  const [data, setData] = useState({
    obrasPorTempo: [],
    obrasPorEmpresa: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const { data: empresasData, error: empresasError } = await supabase
          .from('empresa')
          .select('cnpj, nome_fantasia')
          .eq('user_id', userId);
        if (empresasError) throw new Error(empresasError.message);

        const cnpjs = empresasData ? empresasData.map(emp => emp.cnpj) : [];

        const { data: obrasData, error: obrasError } = await supabase
          .from('obra')
          .select('data_inicio, cnpj_empresa')
          .in('cnpj_empresa', cnpjs.length > 0 ? cnpjs : [''])
          .not('data_inicio', 'is', null);
        if (obrasError) throw new Error(obrasError.message);

        const obrasPorTempo = obrasData
          .reduce((acc, obra) => {
            const mesAno = new Date(obra.data_inicio).toISOString().slice(0, 7);
            acc[mesAno] = (acc[mesAno] || 0) + 1;
            return acc;
          }, {});
        
        const obrasPorTempoFormatted = Object.entries(obrasPorTempo)
          .map(([mes_ano, quantidade]) => ({ mes_ano, quantidade: Math.round(quantidade) }))
          .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));

        const obrasPorEmpresa = obrasData
          .reduce((acc, obra) => {
            const empresa = empresasData.find(emp => emp.cnpj === obra.cnpj_empresa);
            const nomeFantasia = empresa ? empresa.nome_fantasia : 'Sem Nome';
            acc[nomeFantasia] = (acc[nomeFantasia] || 0) + 1;
            return acc;
          }, {});
        
        const obrasPorEmpresaFormatted = Object.entries(obrasPorEmpresa)
          .map(([nome_fantasia, quantidade]) => ({ nome_fantasia, quantidade: Math.round(quantidade) }))
          .sort((a, b) => b.quantidade - a.quantidade);

        setData({
          obrasPorTempo: obrasPorTempoFormatted,
          obrasPorEmpresa: obrasPorEmpresaFormatted,
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const obrasPorTempoData = {
    labels: data.obrasPorTempo.length
      ? data.obrasPorTempo.map(item => item.mes_ano)
      : ['2025-09'],
    datasets: [
      {
        label: 'Obras Iniciadas',
        data: data.obrasPorTempo.length
          ? data.obrasPorTempo.map(item => item.quantidade)
          : [0],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const obrasPorEmpresaData = {
    labels: data.obrasPorEmpresa.length
      ? data.obrasPorEmpresa.map(item => item.nome_fantasia)
      : ['Nenhuma Empresa'],
    datasets: [
      {
        label: 'Obras por Empresa',
        data: data.obrasPorEmpresa.length
          ? data.obrasPorEmpresa.map(item => item.quantidade)
          : [0],
        backgroundColor: ['rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: function(value) {
            return Number.isInteger(value) ? value : null;
          }
        }
      }
    }
  };

  return (
    <main className={`main-content admin-dashboard ${isSidebarMinimized ? 'shifted-left' : ''}`}>
      <header className="main-header">
        <Bell />
      </header>
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-icon"><LayoutDashboard /></div>
          <div className="stat-content">
            <h3>Usuários</h3>
            <p>{counts.users || 0}</p>
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

      <section className="section">
        <div className="section-header">
          <h2>Estatísticas de Obras</h2>
        </div>
        {loading && <p>Carregando gráficos...</p>}
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '600px' }}>
              <h3>Obras por Tempo</h3>
              <Line data={obrasPorTempoData} options={chartOptions} />
            </div>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '600px' }}>
              <h3>Obras por Empresa</h3>
              <Bar data={obrasPorEmpresaData} options={chartOptions} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminDashboard;