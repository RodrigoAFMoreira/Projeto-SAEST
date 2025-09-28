import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar';
import EpiFiltro from './componentes/epiFiltro';
import TabelaEpi from './componentes/epiTable';
import ModalFormularioEpi from './componentes/epiFormModal';
import ModalGerenciarOpcoes from './componentes/opcoesModal';
import ModalConfirmacao from './componentes/confirmModal';
import LoadingSpinner from './componentes/carregando'; 
import '../src/css/epi.css';

const Epi = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [epis, setEpis] = useState([]);
  const [filtros, setFiltros] = useState({
    'filtro-tipo': '',
    'filtro-condicao': '',
    'filtro-local-uso': '',
    'filtro-disponibilidade': '',
    'filtro-validade': '',
    'filtro-codigo': '',
  });
  const [exibirModalAdicionar, setExibirModalAdicionar] = useState(false);
  const [exibirModalEditar, setExibirModalEditar] = useState(false);
  const [exibirModalGerenciar, setExibirModalGerenciar] = useState(false);
  const [exibirModalConfirmacao, setExibirModalConfirmacao] = useState(false);
  const [epiSelecionadoId, setEpiSelecionadoId] = useState(null);
  const [linhasExpandidas, setLinhasExpandidas] = useState([]);
  const [tiposEpi, setTiposEpi] = useState([
    { value: 'capacete', label: 'Capacete' },
    { value: 'luvas', label: 'Luvas' },
    { value: 'botas', label: 'Botas' },
    { value: 'mascara', label: 'Máscara' },
    { value: 'oculos', label: 'Óculos de Proteção' },
  ]);
  const [locaisUso, setLocaisUso] = useState([
    { value: 'canteiro', label: 'Canteiro de Obras' },
    { value: 'armazem', label: 'Armazém' },
    { value: 'escritorio', label: 'Escritório' },
    { value: 'manutencao', label: 'Manutenção' },
  ]);
  const [obras, setObras] = useState([]);
  const [dadosFormulario, setDadosFormulario] = useState({});
  const [formularioGerenciar, setFormularioGerenciar] = useState({ novoTipo: '', novoLocal: '' });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const [loading, setLoading] = useState(true);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUserAndData = async () => {
      setLoading(true);
      setErro('');
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setErro('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login', { state: { from: location } }), 2000);
          return;
        }

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

        if (data && data.tipo !== 'user') {
          await Promise.all([carregarObras(user.id), carregarEpis(user.id)]);
        } else {
          setErro('Acesso não autorizado para este usuário.');
          setTimeout(() => navigate('/menu'), 2000);
        }
      } catch (err) {
        setErro('Erro ao carregar dados do usuário: ' + (err.message || 'Erro desconhecido.'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [navigate, location]);

  const carregarObras = async (userId) => {
    try {
      const { data: dadosEmpresas, error: erroEmpresas } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('user_id', userId);
      if (erroEmpresas) throw erroEmpresas;

      const cnpjs = dadosEmpresas.map(emp => emp.cnpj);
      const { data: dadosObras, error: erroObras } = await supabase
        .from('obra')
        .select('id, cnpj_empresa, status')
        .in('cnpj_empresa', cnpjs);
      if (erroObras) throw erroObras;

      setObras(
        dadosObras?.map((o) => ({
          value: o.id,
          label: `Obra ${o.id} (${o.status})`,
        })) || []
      );
    } catch (err) {
      console.error('Erro ao carregar obras:', err);
      setErro('Erro ao carregar obras: ' + (err.message || 'Erro desconhecido.'));
      setObras([]);
    }
  };

  const carregarEpis = async (userId) => {
    try {
      const { data: dadosEmpresas, error: erroEmpresas } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('user_id', userId);
      if (erroEmpresas) throw erroEmpresas;

      const cnpjs = dadosEmpresas.map(emp => emp.cnpj);
      const { data: dadosObras, error: erroObras } = await supabase
        .from('obra')
        .select('id')
        .in('cnpj_empresa', cnpjs);
      if (erroObras) throw erroObras;

      const obraIds = dadosObras.map(obra => obra.id);

      let consulta = supabase
        .from('epis')
        .select('*, obra(id, cnpj_empresa)')
        .in('obra_id', obraIds);

      if (filtros['filtro-tipo']) consulta = consulta.ilike('tipo', `%${filtros['filtro-tipo']}%`);
      if (filtros['filtro-condicao']) consulta = consulta.eq('condicao', filtros['filtro-condicao']);
      if (filtros['filtro-local-uso']) consulta = consulta.ilike('local_uso', `%${filtros['filtro-local-uso']}%`);
      if (filtros['filtro-disponibilidade']) consulta = consulta.eq('disponibilidade', filtros['filtro-disponibilidade']);
      if (filtros['filtro-codigo']) consulta = consulta.ilike('nome', `%${filtros['filtro-codigo']}%`);
      if (filtros['filtro-validade']) {
        if (filtros['filtro-validade'] === 'válido') consulta = consulta.gt('validade', hoje);
        if (filtros['filtro-validade'] === 'expirado') consulta = consulta.lte('validade', hoje);
        if (filtros['filtro-validade'] === 'sem-validade') consulta = consulta.is('validade', null);
      }

      const { data, error } = await consulta;
      if (error) throw error;
      setEpis(data || []);
    } catch (err) {
      console.error('Erro ao carregar EPIs:', err);
      setErro('Erro ao carregar EPIs: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const alterarFiltros = (e) => {
    setFiltros({ ...filtros, [e.target.id]: e.target.value });
  };

  const abrirModalAdicionarEpi = () => {
    setDadosFormulario({ obra_id: obras[0]?.value || '' });
    setExibirModalAdicionar(true);
    setErro('');
    setSucesso('');
  };

  const fecharModalAdicionarEpi = () => {
    setExibirModalAdicionar(false);
    setErro('');
    setSucesso('');
  };

  const abrirModalEditarEpi = (epi) => {
    setDadosFormulario(epi);
    setExibirModalEditar(true);
    setErro('');
    setSucesso('');
  };

  const fecharModalEditarEpi = () => {
    setExibirModalEditar(false);
    setErro('');
    setSucesso('');
  };

  const abrirModalGerenciarOpcoes = () => {
    setExibirModalGerenciar(true);
    setErro('');
    setSucesso('');
  };

  const fecharModalGerenciarOpcoes = () => {
    setExibirModalGerenciar(false);
    setFormularioGerenciar({ novoTipo: '', novoLocal: '' });
    setErro('');
    setSucesso('');
  };

  const abrirModalConfirmarExclusao = (epiId) => {
    setEpiSelecionadoId(epiId);
    setExibirModalConfirmacao(true);
  };

  const fecharModalConfirmarExclusao = () => {
    setExibirModalConfirmacao(false);
    setEpiSelecionadoId(null);
  };

  const alterarFormularioEpi = (e) => {
    setDadosFormulario({ ...dadosFormulario, [e.target.id]: e.target.value });
  };

  const alterarFormularioGerenciar = (e) => {
    setFormularioGerenciar({ ...formularioGerenciar, [e.target.id]: e.target.value });
  };

  const enviarFormularioEpi = async (e, ehEdicao = false) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const dados = {
      nome: dadosFormulario.nome?.trim(),
      tipo: dadosFormulario.tipo,
      condicao: dadosFormulario.condicao,
      local_uso: dadosFormulario.local_uso,
      disponibilidade: dadosFormulario.disponibilidade,
      data_aquisicao: dadosFormulario.data_aquisicao,
      validade: dadosFormulario.validade || null,
      ano_fabricacao: dadosFormulario.ano_fabricacao ? parseInt(dadosFormulario.ano_fabricacao) : null,
      descricao: dadosFormulario.descricao?.trim(),
      quantidade: dadosFormulario.quantidade ? parseInt(dadosFormulario.quantidade) : null,
      obra_id: dadosFormulario.obra_id,
    };

    const erros = [];
    if (!dados.nome) erros.push('Nome/Código é obrigatório.');
    if (!dados.tipo) erros.push('Tipo de EPI é obrigatório.');
    if (!dados.condicao) erros.push('Condição é obrigatória.');
    if (!dados.local_uso) erros.push('Local de uso é obrigatório.');
    if (!dados.disponibilidade) erros.push('Disponibilidade é obrigatória.');
    if (!dados.data_aquisicao) erros.push('Data de aquisição é obrigatória.');
    if (!dados.quantidade || dados.quantidade < 1) erros.push('Quantidade deve ser maior que 0.');
    if (!dados.obra_id) erros.push('Obra associada é obrigatória.');

    if (erros.length > 0) {
      setErro(erros.join(' '));
      return;
    }

    try {
      if (ehEdicao) {
        await supabase.from('epis').update(dados).eq('id', dadosFormulario.id);
        setSucesso('EPI atualizado com sucesso!');
      } else {
        await supabase.from('epis').insert([dados]);
        setSucesso('EPI adicionado com sucesso!');
      }
      await carregarEpis(userData.id);
      setTimeout(() => {
        ehEdicao ? fecharModalEditarEpi() : fecharModalAdicionarEpi();
      }, 1000);
    } catch (err) {
      setErro('Erro: ' + (err.message || 'Falha ao salvar EPI.'));
    }
  };

  const excluirEpi = async () => {
    try {
      await supabase.from('epis').delete().eq('id', epiSelecionadoId);
      setEpis(epis.filter((epi) => epi.id !== epiSelecionadoId));
      fecharModalConfirmarExclusao();
    } catch (err) {
      setErro('Erro ao excluir EPI: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  const adicionarTipoEpi = async () => {
    const novoTipo = formularioGerenciar.novoTipo.trim();
    if (!novoTipo) {
      setErro('Digite um tipo de EPI.');
      return;
    }
    if (tiposEpi.some((t) => t.label.toLowerCase() === novoTipo.toLowerCase())) {
      setErro('Este tipo de EPI já existe.');
      return;
    }
    setTiposEpi([...tiposEpi, {
      value: novoTipo.toLowerCase().replace(/\s+/g, '-'),
      label: novoTipo,
    }]);
    setFormularioGerenciar({ ...formularioGerenciar, novoTipo: '' });
    setSucesso('Tipo de EPI adicionado com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const adicionarLocalUso = async () => {
    const novoLocal = formularioGerenciar.novoLocal.trim();
    if (!novoLocal) {
      setErro('Digite um local de uso.');
      return;
    }
    if (locaisUso.some((l) => l.label.toLowerCase() === novoLocal.toLowerCase())) {
      setErro('Este local de uso já existe.');
      return;
    }
    setLocaisUso([...locaisUso, {
      value: novoLocal.toLowerCase().replace(/\s+/g, '-'),
      label: novoLocal,
    }]);
    setFormularioGerenciar({ ...formularioGerenciar, novoLocal: '' });
    setSucesso('Local de uso adicionado com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const removerTipoEpi = (indice) => {
    setTiposEpi(tiposEpi.filter((_, i) => i !== indice));
    setSucesso('Tipo de EPI removido com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const removerLocalUso = (indice) => {
    setLocaisUso(locaisUso.filter((_, i) => i !== indice));
    setSucesso('Local de uso removido com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const alternarExpansao = (epiId) => {
    setLinhasExpandidas((prev) =>
      prev.includes(epiId) ? prev.filter((id) => id !== epiId) : [...prev, epiId]
    );
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
      ) : erro ? (
        <ErrorMessage message={erro} onRetry={() => window.location.reload()} />
      ) : userData ? (
        <div className={`dashboard-wrapper ${isSidebarMinimized ? 'minimized' : ''}`}>
          <div className={`sidebar-wrapper ${isSidebarMinimized ? 'minimized' : ''}`}>
            <Sidebar
              userType={userData.tipo}
              userEmail={userData.email}
              isMinimized={isSidebarMinimized}
              onToggle={handleToggleSidebar}
            />
          </div>
          <main className="main-content">
            <header className="main-header">
              <div className="header-content">
                <div className="header-icons">
                  <i className="ri-notification-3-line"></i>
                </div>
              </div>
            </header>
            <section className="section">
              <div className="section-header">
                <h2>Equipamentos de Proteção Individual</h2>
                <EpiFiltro
                  filtros={filtros}
                  aoAlterarFiltros={alterarFiltros}
                  abrirModalAdicionar={abrirModalAdicionarEpi}
                  abrirModalGerenciar={abrirModalGerenciarOpcoes}
                />
              </div>
              <TabelaEpi
                epis={epis}
                obras={obras}
                linhasExpandidas={linhasExpandidas}
                alternarExpansao={alternarExpansao}
                editarEpi={abrirModalEditarEpi}
                excluirEpi={abrirModalConfirmarExclusao}
              />
            </section>
            <ModalFormularioEpi
              estaAberto={exibirModalAdicionar}
              fecharModal={fecharModalAdicionarEpi}
              dadosFormulario={dadosFormulario}
              alterarFormulario={alterarFormularioEpi}
              enviarFormulario={enviarFormularioEpi}
              tiposEpi={tiposEpi}
              locaisUso={locaisUso}
              obras={obras}
              erro={erro}
              sucesso={sucesso}
              ehEdicao={false}
            />
            <ModalFormularioEpi
              estaAberto={exibirModalEditar}
              fecharModal={fecharModalEditarEpi}
              dadosFormulario={dadosFormulario}
              alterarFormulario={alterarFormularioEpi}
              enviarFormulario={enviarFormularioEpi}
              tiposEpi={tiposEpi}
              locaisUso={locaisUso}
              obras={obras}
              erro={erro}
              sucesso={sucesso}
              ehEdicao={true}
            />
            <ModalGerenciarOpcoes
              estaAberto={exibirModalGerenciar}
              fecharModal={fecharModalGerenciarOpcoes}
              tiposEpi={tiposEpi}
              locaisUso={locaisUso}
              formularioGerenciar={formularioGerenciar}
              alterarFormularioGerenciar={alterarFormularioGerenciar}
              adicionarTipo={adicionarTipoEpi}
              adicionarLocal={adicionarLocalUso}
              removerTipo={removerTipoEpi}
              removerLocal={removerLocalUso}
              erro={erro}
              sucesso={sucesso}
            />
            <ModalConfirmacao
              estaAberto={exibirModalConfirmacao}
              fecharModal={fecharModalConfirmarExclusao}
              confirmar={excluirEpi}
              titulo="Confirmar Exclusão"
              mensagem="Tem certeza que deseja excluir este EPI?"
            />
          </main>
        </div>
      ) : null}
    </div>
  );
};

export default Epi;