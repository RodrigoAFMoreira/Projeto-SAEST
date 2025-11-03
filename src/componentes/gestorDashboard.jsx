// Em uso em dashboard.jsx
// Componente de dashboard para gestores

import React, { useState, useEffect } from 'react';
import { Bell, Building2, Building, ShieldCheck } from 'lucide-react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import supabase from '../config/supabaseClient';
import '../css/dashboard.css';
ChartJS.register(ArcElement, Title, Tooltip, Legend, ChartDataLabels);

const AdminDashboard = ({ isSidebarMinimized, counts, userId }) => {
  const [data, setData] = useState({
    obrasPorEmpresa: [],
    episPorAquisicao: [],
    episPorLocalUso: [],
    episPorCondicao: [],
    episPorStatus: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthFilter, setMonthFilter] = useState('');
  const [construtoraFilter, setConstrutoraFilter] = useState('');
  const [obraFilter, setObraFilter] = useState('');
  const [epiTypeFilter, setEpiTypeFilter] = useState('');
  const [epiConditionFilter, setEpiConditionFilter] = useState('');
  const [epiValidityFilter, setEpiValidityFilter] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableConstrutoras, setAvailableConstrutoras] = useState([]);
  const [availableObras, setAvailableObras] = useState([]);
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
          .select(`
            id,
            cnpj_empresa,
            data_inicio,
            endereco_id,
            endereco:endereco_id (logradouro)
          `)
          .in('cnpj_empresa', cnpjs.length > 0 ? cnpjs : ['']);

        if (construtoraFilter) {
          const selectedCnpj = empresasData.find(emp => emp.nome_fantasia === construtoraFilter)?.cnpj;
          if (selectedCnpj) obrasQuery = obrasQuery.eq('cnpj_empresa', selectedCnpj);
        }

        const { data: obrasData, error: obrasError } = await obrasQuery;
        if (obrasError) throw new Error(obrasError.message);

        const obraIds = obrasData ? obrasData.map(obra => obra.id) : [];

        let episQuery = supabase
          .from('epis')
          .select('data_aquisicao, local_uso, quantidade, tipo, condicao, validade, disponibilidade, obra_id')
          .in('obra_id', obraFilter ? [obraFilter] : obraIds.length > 0 ? obraIds : [''])
          .not('data_aquisicao', 'is', null);

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

        const months = [...new Set(episData.map(epi => new Date(epi.data_aquisicao).toISOString().slice(0, 7)))].sort(
          (a, b) => a.localeCompare(b)
        );

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

        const episPorCondicao = episData.reduce((acc, epi) => {
          const condicao = epi.condicao || 'Desconhecido';
          acc[condicao] = (acc[condicao] || 0) + (epi.quantidade || 0);
          return acc;
        }, {});

        const episPorCondicaoFormatted = Object.entries(episPorCondicao)
          .map(([condicao, quantidade]) => ({ condicao, quantidade: Math.round(quantidade) }))
          .sort((a, b) => b.quantidade - a.quantidade);

        const episPorStatus = episData.reduce((acc, epi) => {
          const status = epi.disponibilidade || 'Desconhecido';
          acc[status] = (acc[status] || 0) + (epi.quantidade || 0);
          return acc;
        }, {});

        const episPorStatusFormatted = Object.entries(episPorStatus)
          .map(([status, quantidade]) => ({ status, quantidade: Math.round(quantidade) }))
          .sort((a, b) => b.quantidade - a.quantidade);

        setData({
          obrasPorEmpresa: construtoraFilter ? obrasPorEmpresaFormatted.filter(item => item.nome_fantasia === construtoraFilter) : obrasPorEmpresaFormatted,
          episPorAquisicao: monthFilter ? episPorAquisicaoFormatted.filter(item => item.mes_ano === monthFilter) : episPorAquisicaoFormatted,
          episPorLocalUso: episPorLocalUsoFormatted,
          episPorCondicao: episPorCondicaoFormatted,
          episPorStatus: episPorStatusFormatted,
        });

        setAvailableMonths(months);
        setAvailableConstrutoras(empresasData ? empresasData.map(emp => emp.nome_fantasia) : []);
        setAvailableObras(obrasData ? obrasData.map(obra => ({
          id: obra.id,
          display: obra.endereco?.logradouro || 'Sem Endereço', 
        })) : []);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId, construtoraFilter, obraFilter, epiTypeFilter, epiConditionFilter, epiValidityFilter, monthFilter]);

  const handleMonthFilterChange = e => setMonthFilter(e.target.value);
  const handleConstrutoraFilterChange = e => {
    setConstrutoraFilter(e.target.value);
    setObraFilter('');
  };
  const handleObraFilterChange = e => setObraFilter(e.target.value);
  const handleEpiTypeFilterChange = e => setEpiTypeFilter(e.target.value);
  const handleEpiConditionFilterChange = e => setEpiConditionFilter(e.target.value);
  const handleEpiValidityFilterChange = e => setEpiValidityFilter(e.target.value);

  const clearFilters = () => {
    setMonthFilter('');
    setConstrutoraFilter('');
    setObraFilter('');
    setEpiTypeFilter('');
    setEpiConditionFilter('');
    setEpiValidityFilter('');
  };

  const obrasPorEmpresaData = {
    labels: data.obrasPorEmpresa.length ? data.obrasPorEmpresa.map(item => item.nome_fantasia) : [construtoraFilter || 'Nenhuma Empresa'],
    datasets: [
      {
        label: 'Obras por Empresa',
        data: data.obrasPorEmpresa.length ? data.obrasPorEmpresa.map(item => item.quantidade) : [0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
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
        backgroundColor: [
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const episPorLocalUsoData = {
    labels: data.episPorLocalUso.length ? data.episPorLocalUso.map(item => item.local_uso) : ['Nenhum Local'],
    datasets: [
      {
        label: 'EPIs por Local de Uso',
        data: data.episPorLocalUso.length ? data.episPorLocalUso.map(item => item.quantidade) : [0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const episPorCondicaoData = {
    labels: data.episPorCondicao.length ? data.episPorCondicao.map(item => item.condicao) : ['Nenhuma Condição'],
    datasets: [
      {
        label: 'EPIs por Condição',
        data: data.episPorCondicao.length ? data.episPorCondicao.map(item => item.quantidade) : [0],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 159, 64, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const episPorStatusData = {
    labels: data.episPorStatus.length ? data.episPorStatus.map(item => item.status) : ['Nenhum Status'],
    datasets: [
      {
        label: 'EPIs por Status',
        data: data.episPorStatus.length ? data.episPorStatus.map(item => item.quantidade) : [0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold',
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return value !== 0 ? `${value} (${percentage}%)` : '';
        },
        align: 'center',
        anchor: 'center',
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
        <h2>Estatísticas de Obras e EPIs</h2>
        {loading && <p>Carregando gráficos...</p>}
        {error && <p style={{ color: 'red' }}>Erro: {error}</p>}
        {!loading && !error && (
          <div className="charts-container">
            <div className="chart-wrapper">
              <h3>Obras por Empresa</h3>
              <div className="chart-canvas">
                <Pie data={obrasPorEmpresaData} options={pieChartOptions} />
              </div>
              <div className="chart-filters">
                <select value={construtoraFilter} onChange={handleConstrutoraFilterChange}>
                  <option value="">Todas as Construtoras</option>
                  {availableConstrutoras.map(construtora => (
                    <option key={construtora} value={construtora}>{construtora}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="chart-wrapper">
              <h3>EPIs Adquiridos por Tempo</h3>
              <div className="chart-canvas">
                <Pie data={episPorAquisicaoData} options={pieChartOptions} />
              </div>
              <div className="chart-filters">
                <select value={obraFilter} onChange={handleObraFilterChange}>
                  <option value="">Selecione uma Obra</option>
                  {availableObras.map(obra => (
                    <option key={obra.id} value={obra.id}>{obra.display}</option>
                  ))}
                </select>
                <select value={monthFilter} onChange={handleMonthFilterChange}>
                  <option value="">Todos os Meses</option>
                  {availableMonths.map(month => (
                    <option key={month} value={month}>{month}</option>
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
              </div>
            </div>
            <div className="chart-wrapper">
              <h3>EPIs por Local de Uso</h3>
              <div className="chart-canvas">
                <Pie data={episPorLocalUsoData} options={pieChartOptions} />
              </div>
              <div className="chart-filters">
                <select value={obraFilter} onChange={handleObraFilterChange}>
                  <option value="">Selecione uma Obra</option>
                  {availableObras.map(obra => (
                    <option key={obra.id} value={obra.id}>{obra.display}</option>
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
              </div>
            </div>
            <div className="chart-wrapper">
              <h3>EPIs por Condição</h3>
              <div className="chart-canvas">
                <Pie data={episPorCondicaoData} options={pieChartOptions} />
              </div>
              <div className="chart-filters">
                <select value={obraFilter} onChange={handleObraFilterChange}>
                  <option value="">Selecione uma Obra</option>
                  {availableObras.map(obra => (
                    <option key={obra.id} value={obra.id}>{obra.display}</option>
                  ))}
                </select>
                <select value={epiTypeFilter} onChange={handleEpiTypeFilterChange}>
                  <option value="">Todos os Tipos de EPI</option>
                  {availableEpiTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select value={epiValidityFilter} onChange={handleEpiValidityFilterChange}>
                  <option value="">Todos os Status de Validade</option>
                  <option value="válido">Válido</option>
                  <option value="expirado">Expirado</option>
                  <option value="sem-validade">Sem Validade</option>
                </select>
              </div>
            </div>
            <div className="chart-wrapper">
              <h3>EPIs por Status</h3>
              <div className="chart-canvas">
                <Pie data={episPorStatusData} options={pieChartOptions} />
              </div>
              <div className="chart-filters">
                <select value={obraFilter} onChange={handleObraFilterChange}>
                  <option value="">Selecione uma Obra</option>
                  {availableObras.map(obra => (
                    <option key={obra.id} value={obra.id}>{obra.display}</option>
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
              </div>
            </div>
          </div>
        )}
        <button onClick={clearFilters} style={{ marginTop: '20px' }}>Limpar Filtros</button>
      </section>
    </main>
  );
};

export default AdminDashboard;