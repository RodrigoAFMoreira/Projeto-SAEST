import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import LoadingSpinner from './componentes/carregando';
import UserDashboard from './componentes/userDashboard';
import AdminGestorDashboard from './componentes/adminGestorDashboard';
import Sidebar from './Sidebar';
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

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setUser(user);

        const { data, error: userError } = await supabase
          .from('usuarios')
          .select('id, nome, email, tipo, telefone')
          .eq('id', user.id)
          .single();
        if (userError || !data) {
          console.warn('Documento do usuário não encontrado, usando padrão user');
          setUserData({ tipo: 'user', nome: '', email: user.email, telefone: '' });
        } else {
          setUserData(data);
        }
      } catch (err) {
        setError('Erro ao carregar dados do usuário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // silenciados por hora
  /*
  const [counts, setCounts] = useState({ users: 0, empresas: 0, obras: 0, epis: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [users, empresas, obras, epis] = await Promise.all([
          supabase.from('usuarios').select('id', { count: 'exact' }),
          supabase.from('empresas').select('id', { count: 'exact' }),
          supabase.from('obras').select('id', { count: 'exact' }),
          supabase.from('epis').select('id', { count: 'exact' }),
        ]);
        setCounts({
          users: users.count || 0,
          empresas: empresas.count || 0,
          obras: obras.count || 0,
          epis: epis.count || 0,
        });
      } catch (error) {
        console.error('Erro ao carregar contadores:', error.message);
        setError('Erro ao carregar estatísticas. Tente novamente.');
      }
    };

    const fetchChartData = async () => {
      try {
        const { data, error } = await supabase
          .from('obras')
          .select('created_at')
          .order('created_at', { ascending: true });
        if (error) throw error;

        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const countsByMonth = data.reduce((acc, item) => {
          const month = new Date(item.created_at).getMonth();
          acc[month] = (acc[month] || 0) + 1;
          return acc;
        }, {});
        const chartData = {
          labels: months.slice(0, 7),
          datasets: [
            {
              label: 'Obras',
              data: months.slice(0, 7).map((_, i) => countsByMonth[i] || 0),
              borderColor: '#1e3a8a',
              tension: 0.4,
              fill: true,
              backgroundColor: 'rgba(30, 58, 138, 0.1)',
            },
          ],
        };
        setChartData(chartData);
      } catch (error) {
        console.error('Erro ao carregar dados do gráfico:', error.message);
      }
    };

    if (!loading && userData.tipo !== 'user') {
      fetchCounts();
      fetchChartData();
    }
  }, [loading, userData.tipo]);

  const [chartData, setChartData] = useState({
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Obras',
        data: [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#1e3a8a',
        tension: 0.4,
        fill: true,
        backgroundColor: 'rgba(30, 58, 138, 0.1)',
      },
    ],
  });

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => val / 1000 + 'K' },
        },
      },
    }),
    []
  );
  */

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const ErrorMessage = ({ message, onRetry }) => (
    <div className="error-container">
      <p>{message}</p>
      <button onClick={onRetry}>Tentar novamente</button>
    </div>
  );

  return (
    <div className="container">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => window.location.reload()} />
      ) : user ? (
        <div className="dashboard-wrapper">
          <div className={`sidebar-wrapper ${isSidebarMinimized ? 'minimized' : ''}`}>
            <Sidebar
              userType={userData.tipo}
              userEmail={userData.email}
              isMinimized={isSidebarMinimized}
              onToggle={handleToggleSidebar}
            />
          </div>
          {userData.tipo === 'user' ? (
            <UserDashboard isSidebarMinimized={isSidebarMinimized} user={userData} />
          ) : (
            <AdminGestorDashboard
              isSidebarMinimized={isSidebarMinimized}
              // counts={counts}
              // chartData={chartData}
              // chartOptions={chartOptions}
            />
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Dashboard;