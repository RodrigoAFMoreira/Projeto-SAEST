// src/dashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient'; 
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { LayoutDashboard, Building2, CalendarClock, FileText, Settings, HelpCircle, Bell, Home, Building, File, ShieldCheck } from 'lucide-react';
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

const Sidebar = ({ userType, userEmail }) => {
  const navigate = useNavigate();
  const items = userType === 'funcionario'
    ? [
        { text: 'Informações', path: '#', icon: <LayoutDashboard /> },
        { text: 'Certificações', path: '/certificacoes', icon: <FileText /> },
        { text: 'Configurações', path: '#', icon: <Settings /> },
      ]
    : [
        { text: 'Dashboard', path: '/menu', icon: <Home /> },
        { text: 'Construtoras', path: '/menuConstrutora', icon: <Building /> },
        { text: 'Obras', path: '/menuObra', icon: <Building2 /> },
        { text: 'Documentos', path: '/menuDocumentosObra', icon: <File /> },
        { text: 'EPIs', path: '/epi', icon: <ShieldCheck /> },
        { text: 'Configurações', path: '/configuracaoUser', icon: <Settings /> },
      ];

  return (
    <aside className={`sidebar role-${userType}`}>
      <div>
        <div className="sidebar-header">
          <div className="logo">SAEST</div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {items.map((item, index) => (
              <li key={item.text} className={index === 0 ? 'active' : ''}>
                <a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>
                  {item.icon}
                  <span>{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="user-profile">
        <div className="user-info">
          <div className={`name role-${userType}`}>{userType}</div>
          <div className="email" id="user-email">{userEmail || 'carregando...'}</div>
        </div>
      </div>
    </aside>
  );
};

const DataTable = ({ collectionName, listId, userType }) => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [obras, setObras] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: items, error } = await supabase.from(collectionName).select('*');
        if (error) throw error;
        setData(items);

        if (collectionName === 'epis') {
          const { data: obrasData, error: obrasError } = await supabase.from('obras').select('*');
          if (obrasError) throw obrasError;
          setObras(obrasData);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${collectionName}:`, error.message);
      }
    };
    fetchData();
  }, [collectionName]);

  const renderRow = (item) => {
    if (collectionName === 'obras') {
      return (
        <tr key={item.id}>
          <td>{item.endereco || 'N/A'}</td>
          <td>{item.responsavel_tecnico || item.responsavelTecnico || 'N/A'}</td>
          <td>{item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Ativa'}</td>
          <td>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/detalhesObra/${item.id}`); }}>
              Ver
            </a>
          </td>
        </tr>
      );
    } else if (collectionName === 'epis') {
      const obra = obras.find((obra) => obra.id === item.obraId);
      return (
        <tr key={item.id}>
          <td>{item.tipo || 'N/A'}</td>
          <td>{obra ? (obra.nome || obra.endereco || 'Obra sem nome') : 'Não especificada'}</td>
          <td>{item.quantidade || 'N/A'}</td>
          <td>{item.disponibilidade || 'N/A'}</td>
          <td>
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/epi'); }}>
              Ver
            </a>
          </td>
        </tr>
      );
    } else if (collectionName === 'users') {
      return <p key={item.id}>{item.username || 'N/A'}</p>;
    }
    return null;
  };

  return (
    <div>
      {data.length === 0 ? (
        <tr>
          <td colSpan="5">Nenhum {collectionName} encontrado.</td>
        </tr>
      ) : (
        data.map(renderRow)
      )}
    </div>
  );
};

const EmpresasTable = () => {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: empresasData, error: empresasError } = await supabase.from('empresas').select('*');
        const { data: obrasData, error: obrasError } = await supabase.from('obras').select('*');
        if (empresasError || obrasError) throw new Error('Erro ao carregar dados');
        setEmpresas(empresasData);
        setObras(obrasData);
      } catch (error) {
        console.error('Erro ao carregar empresas:', error.message);
      }
    };
    fetchData();
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Construtora</th>
          <th>Obras</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {empresas.length === 0 ? (
          <tr>
            <td colSpan="4">Nenhuma construtora encontrada.</td>
          </tr>
        ) : (
          empresas.map((empresa) => {
            const obrasRelacionadas = obras.filter((obra) => obra.empresaId === empresa.id);
            return (
              <tr key={empresa.id}>
                <td>{empresa.razaoSocial || 'Nome não disponível'}</td>
                <td>
                  {obrasRelacionadas.length > 0 ? (
                    <div>
                      {obrasRelacionadas.map((obra) => (
                        <div key={obra.id} className="obra-item">
                          {obra.endereco || 'Obra sem endereço'}
                        </div>
                      ))}
                    </div>
                  ) : (
                    'Nenhuma obra relacionada'
                  )}
                </td>
                <td>{empresa.status ? empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1) : 'Ativa'}</td>
                <td>
                  <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/menuEmpresa/${empresa.id}`); }}>
                    Ver
                  </a>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'funcionario' });
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

      const { data, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (userError || !data) {
        console.warn('Documento do usuário não encontrado, usando padrão funcionário');
        setUserData({ tipo: 'funcionario' });
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
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('empresas').select('id', { count: 'exact' }),
          supabase.from('obras').select('id', { count: 'exact' }),
          supabase.from('epis').select('id', { count: 'exact' }),
        ]);
        setTimeout(() => {
          document.getElementById('users-list').textContent = users.count || 0;
          document.getElementById('empresas-list').textContent = empresas.count || 0;
          document.getElementById('obras-list').textContent = obras.count || 0;
          document.getElementById('epis-list').textContent = epis.count || 0;
          document.querySelectorAll('.change-text').forEach((el) => {
            el.textContent = `${Math.floor(Math.random() * 15) + 5}% no último mês`;
          });
        }, 800);
      } catch (error) {
        console.error('Erro ao carregar contadores:', error.message);
      }
    };
    fetchCounts();
  }, []);

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
    <main className="main-content admin-dashboard">
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
          <DataTable collectionName="users" listId="users-details-list" userType={userData.tipo} />
        </div>
      </section>
      <section className="grafico">
        <h3>Obras</h3>
        <Line data={chartData} options={chartOptions} />
      </section>
    </main>
  );

  const renderFuncionarioContent = () => (
    <main className="main-content">
      <header className="main-header">
        <Bell />
      </header>
      <section className="details">
        <h2>Informações</h2>
        <p>Bem-vindo! Aqui você pode acessar suas certificações e dados pessoais.</p>
      </section>
    </main>
  );

  return (
    <div className="container">
      {user && (
        <>
          <Sidebar userType={userData.tipo} userEmail={user.email} />
          {userData.tipo === 'funcionario' ? renderFuncionarioContent() : renderAdminGestorContent()}
        </>
      )}
    </div>
  );
};

export default Dashboard;