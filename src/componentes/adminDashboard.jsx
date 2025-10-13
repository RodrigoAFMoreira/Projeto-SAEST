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
import '../css/dashboard.css';

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
    episPorAquisicao: [],
    episPorLocalUso: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');
  const [construtoraFilter, setConstrutoraFilter] = useState('');
  const [epiTypeFilter, setEpiTypeFilter] = useState('');
  const [epiConditionFilter, setEpiConditionFilter] = useState('');
  const [epiValidityFilter, setEpiValidityFilter] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableConstrutoras, setAvailableConstrutoras] = useState([]);
  const [availableEpiTypes, setAvailableEpiTypes] = useState([]);

  const hoje = new Date().toISOString().split('T')[0];

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
        let obrasQuery = supabase
          .from('obra')
          .select('id, data_inicio, cnpj_empresa')
          .in('cnpj_empresa', cnpjs.length > 0 ? cnpjs : [''])
          .not('data_inicio', 'is', null);
        if (construtoraFilter) {
          const selectedCnpj = empresasData.find(emp => emp.nome_fantasia === construtoraFilter)?.cnpj;
          if (selectedCnpj) obrasQuery = obrasQuery.eq('cnpj_empresa', selectedCnpj);
        }
        if (monthFilter) {
          const startDate = new Date(monthFilter + '-01');
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          obrasQuery = obrasQuery
            .gte('data_inicio', startDate.toISOString().split('T')[0])
            .lt('data_inicio', endDate.toISOString().split('T')[0]);
        }
        const { data: obrasData, error: obrasError } = await obrasQuery;
        if (obrasError) throw new Error(obrasError.message);
        const obraIds = obrasData ? obrasData.map(obra => obra.id) : [];
        let episQuery = supabase
          .from('epis')
          .select('data_aquisicao, local_uso, quantidade, tipo, condicao, validade')
          .in('obra_id', obraIds.length > 0 ? obraIds : [''])
          .not('data_aquisicao', 'is', null);
        if (construtoraFilter) {
          const selectedCnpj = empresasData.find(emp => emp.nome_fantasia === construtoraFilter)?.cnpj;
          if (selectedCnpj) {
            episQuery = episQuery.in(
              'obra_id',
              obrasData.filter(obra => obra.cnpj_empresa === selectedCnpj).map(obra => obra.id)
            );
          }
        }
        if (monthFilter) {
          const startDate = new Date(monthFilter + '-01');
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 1);
          episQuery = episQuery
            .gte('data_aquisicao', startDate.toISOString().split('T')[0])
            .lt('data_aquisicao', endDate.toISOString().split('T')[0]);
        }
        if (epiTypeFilter) episQuery = episQuery.eq('tipo', epiTypeFilter);
        if (epiConditionFilter) episQuery = episQuery.eq('condicao', epiConditionFilter);
        if (epiValidityFilter) {
          if (epiValidityFilter === 'válido') episQuery = episQuery.gt('validade', hoje);
          else if (epiValidityFilter === 'expirado') episQuery = episQuery.lte('validade', hoje).not('validade', 'is', null);
          else if (epiValidityFilter === 'sem-validade') episQuery = episQuery.is('validade', null);
        }
        const { data: episData, error: episError } = await episQuery;
        if (episError) throw new Error(episError.message);
        const epiTypes = [...new Set(episData.map(epi => epi.tipo))].sort();
        setAvailableEpiTypes(epiTypes);
        const months = [...new Set(obrasData.map(obra => new Date(obra.data_inicio).toISOString().slice(0, 7)))].sort((a, b) =>
          a.localeCompare(b)
        );
        const obrasPorTempo = obrasData.reduce((acc, obra) => {
          const mesAno = new Date(obra.data_inicio).toISOString().slice(0, 7);
          acc[mesAno] = (acc[mesAno] || 0) + 1;
          return acc;
        }, {});
        const obrasPorTempoFormatted = Object.entries(obrasPorTempo)
          .map(([mes_ano, quantidade]) => ({ mes_ano, quantidade: Math.round(quantidade) }))
          .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
        const obrasPorEmpresa = obrasData.reduce((acc, obra) => {
          const empresa = empresasData.find(emp => emp.cnpj === obra.cnpj_empresa);
          const nomeFantasia = empresa ? empresa.nome_fantasia : 'Sem Nome';
          acc[nomeFantasia] = (acc[nomeFantasia] || 0) + 1;
          return acc;
        }, {});
        const obrasPorEmpresaFormatted = Object.entries(obrasPorEmpresa)
          .map(([nome_fantasia, quantidade]) => ({ nome_fantasia, quantidade: Math.round(quantidade) }))
          .sort((a, b) => b.quantidade - a.quantidade);
        const episPorAquisicao = episData.reduce((acc, epi) => {
          const mesAno = new Date(epi.data_aquisicao).toISOString().slice(0, 7);
          acc[mesAno] = (acc[mesAno] || 0) + (epi.quantidade || 0);
          return acc;
        }, {});
        const episPorAquisicaoFormatted = Object.entries(episPorAquisicao)
          .map(([mes_ano, quantidade]) => ({ mes_ano, quantidade: Math.round(quantidade) }))
          .sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
        const episPorLocalUso = episData.reduce((acc, epi) => {
          const localUso = epi.local_uso || 'Desconhecido';
          acc[localUso] = (acc[localUso] || 0) + (epi.quantidade || 0);
          return acc;
        }, {});
        const episPorLocalUsoFormatted = Object.entries(episPorLocalUso)
          .map(([local_uso, quantidade]) => ({ local_uso, quantidade: Math.round(quantidade) }))
          .sort((a, b) => b.quantidade - a.quantidade);
        setData({
          obrasPorTempo: monthFilter ? obrasPorTempoFormatted.filter(item => item.mes_ano === monthFilter) : obrasPorTempoFormatted,
          obrasPorEmpresa: construtoraFilter
            ? obrasPorEmpresaFormatted.filter(item => item.nome_fantasia === construtoraFilter)
            : obrasPorEmpresaFormatted,
          episPorAquisicao: monthFilter
            ? episPorAquisicaoFormatted.filter(item => item.mes_ano === monthFilter)
            : episPorAquisicaoFormatted,
          episPorLocalUso: episPorLocalUsoFormatted,
        });
        setAvailableMonths(months);
        setAvailableConstrutoras(empresasData ? empresasData.map(emp => emp.nome_fantasia) : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    if (userId) fetchData();
  }, [userId, monthFilter, construtoraFilter, epiTypeFilter, epiConditionFilter, epiValidityFilter]);

  const handleMonthFilterChange = e => setMonthFilter(e.target.value);
  const handleConstrutoraFilterChange = e => setConstrutoraFilter(e.target.value);
  const handleEpiTypeFilterChange = e => setEpiTypeFilter(e.target.value);
  const handleEpiConditionFilterChange = e => setEpiConditionFilter(e.target.value);
  const handleEpiValidityFilterChange = e => setEpiValidityFilter(e.target.value);
  const clearFilters = () => {
    setMonthFilter('');
    setConstrutoraFilter('');
    setEpiTypeFilter('');
    setEpiConditionFilter('');
    setEpiValidityFilter('');
  };

  const obrasPorTempoData = {
    labels: data.obrasPorTempo.length ? data.obrasPorTempo.map(item => item.mes_ano) : [monthFilter || 'Nenhum Mês'],
    datasets: [
      {
        label: 'Obras Iniciadas',
        data: data.obrasPorTempo.length ? data.obrasPorTempo.map(item => item.quantidade) : [0],
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
      : [construtoraFilter || 'Nenhuma Empresa'],
    datasets: [
      {
        label: 'Obras por Empresa',
        data: data.obrasPorEmpresa.length ? data.obrasPorEmpresa.map(item => item.quantidade) : [0],
        backgroundColor: ['rgba(255, 99, 132, 0.5)'],
        borderColor: ['rgba(255, 99, 132, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const episPorAquisicaoData = {
    labels: data.episPorAquisicao.length ? data.episPorAquisicao.map(item => item.mes_ano) : [monthFilter || 'Nenhum Mês'],
    datasets: [
      {
        label: 'EPIs Adquiridos',
        data: data.episPorAquisicao.length ? data.episPorAquisicao.map(item => item.quantidade) : [0],
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        fill: true,
        tension: 0,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const episPorLocalUsoData = {
    labels: data.episPorLocalUso.length ? data.episPorLocalUso.map(item => item.local_uso) : ['Nenhum Local'],
    datasets: [
      {
        label: 'EPIs por Local de Uso',
        data: data.episPorLocalUso.length ? data.episPorLocalUso.map(item => item.quantidade) : [0],
        backgroundColor: ['rgba(54, 162, 235, 0.5)'],
        borderColor: ['rgba(54, 162, 235, 1)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          callback: value => (Number.isInteger(value) ? value : null),
        },
      },
    },
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
            <p>{counts.empresas || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Building2 /></div>
          <div className="stat-content">
            <h3>Obras</h3>
            <p>{counts.obras || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><ShieldCheck /></div>
          <div className="stat-content">
            <h3>EPIs</h3>
            <p>{counts.epis || 0}</p>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-header">
          <h2>Estatísticas de Obras e EPIs</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <select value={monthFilter} onChange={handleMonthFilterChange}>
              <option value="">Todos os Meses</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
            <select value={construtoraFilter} onChange={handleConstrutoraFilterChange}>
              <option value="">Todas as Construtoras</option>
              {availableConstrutoras.map(construtora => (
                <option key={construtora} value={construtora}>{construtora}</option>
              ))}
            </select>
            <select value={epiTypeFilter} onChange={handleEpiTypeFilterChange}>
              <option value="">Todos os Tipos de EPI</option>
              {availableEpiTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select value={epiConditionFilter} onChange={handleEpiConditionFilterChange}>
              <option value="">Todas as Condições</option>
              <option value="novo">Novo</option>
              <option value="usado">Usado</option>
              <option value="danificado">Danificado</option>
            </select>
            <select value={epiValidityFilter} onChange={handleEpiValidityFilterChange}>
              <option value="">Todos os Status de Validade</option>
              <option value="válido">Válido</option>
              <option value="expirado">Expirado</option>
              <option value="sem-validade">Sem Validade</option>
            </select>
            <button onClick={clearFilters}>Limpar Filtros</button>
          </div>
        </div>
        {loading && <p>Carregando gráficos...</p>}
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
        {!loading && !error && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <h3>Obras por Tempo</h3>
              <Line data={obrasPorTempoData} options={chartOptions} />
            </div>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <h3>Obras por Empresa</h3>
              <Bar data={obrasPorEmpresaData} options={chartOptions} />
            </div>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <h3>EPIs Adquiridos por Tempo</h3>
              <Line data={episPorAquisicaoData} options={chartOptions} />
            </div>
            <div style={{ flex: '1', minWidth: '300px', maxWidth: '400px' }}>
              <h3>EPIs por Local de Uso</h3>
              <Bar data={episPorLocalUsoData} options={chartOptions} />
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminDashboard;