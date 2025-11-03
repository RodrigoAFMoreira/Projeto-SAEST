// src/epi.jsx
// Página principal de gerenciamento de EPIs

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

const mapSupabaseErrorToHttpCode = (error) => {
  if (!error) return { code: 500, message: "Erro interno desconhecido no servidor." };

  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("invalid login") || errorMessage.includes("email not confirmed")) {
    return { code: 401, message: "Credenciais inválidas ou e-mail não verificado." };
  }
  if (errorMessage.includes("duplicate key") || errorMessage.includes("already exists")) {
    return { code: 409, message: "Recurso já existe." };
  }
  if (errorMessage.includes("rate limit")) {
    return { code: 429, message: "Limite de tentativas excedido. Tente novamente mais tarde." };
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return { code: 503, message: "Erro de rede. Verifique sua conexão e tente novamente." };
  }
  if (errorMessage.includes("not found")) {
    return { code: 404, message: "Recurso não encontrado." };
  }
  if (errorMessage.includes("forbidden")) {
    return { code: 403, message: "Acesso não autorizado." };
  }
  return { code: 500, message: "Erro interno do servidor. Tente novamente mais tarde." };
};

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

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchUserAndData = async () => {
      setLoading(true);
      setErro('');
      try {
        console.log("GET /auth/user - Obtendo dados do usuário");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("GET /auth/user - Erro 401: Usuário não autenticado", authError?.message);
          setErro('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login', { state: { from: location } }), 2000);
          return;
        }

        console.log("GET /usuarios - Buscando dados do usuário no banco", { userId: user.id });
        const { data, error: userError } = await supabase
          .from('usuarios')
          .select('id, nome, email, tipo, telefone')
          .eq('id', user.id)
          .single();
        if (userError || !data) {
          console.warn("GET /usuarios - Erro 404: Documento do usuário não encontrado", userError?.message);
          setUserData({ tipo: 'user', nome: '', email: user.email, telefone: '' });
        } else {
          setUserData(data);
          console.log("GET /usuarios - Sucesso, código 200", { userId: user.id });
        }

        if (data?.tipo !== 'user') {
          await Promise.all([carregarObras(user.id), carregarEpis(user.id)]);
        } else {
          console.warn("GET /usuarios - Erro 403: Acesso não autorizado para tipo 'user'");
          setErro('Acesso não autorizado para este usuário.');
          setTimeout(() => navigate('/menu'), 2000);
        }
      } catch (err) {
        console.error(`GET /auth/user - Erro ${mapSupabaseErrorToHttpCode(err).code}:`, err.message);
        setErro(`Erro ao carregar dados do usuário: ${mapSupabaseErrorToHttpCode(err).message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [navigate, location]);

  const carregarObras = async (userId) => {
    try {
      console.log("GET /obras - Buscando obras", { userId });
      const { data: dadosEmpresas, error: erroEmpresas } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('user_id', userId);
      if (erroEmpresas) {
        const mappedError = mapSupabaseErrorToHttpCode(erroEmpresas);
        console.error(`GET /empresas - Erro ${mappedError.code}:`, erroEmpresas.message);
        throw new Error(mappedError.message);
      }

      const cnpjs = dadosEmpresas.map(emp => emp.cnpj);
      const { data: dadosObras, error: erroObras } = await supabase
        .from('obra')
        .select(`
          id,
          cnpj_empresa,
          status,
          endereco_id,
          endereco:endereco_id (logradouro)
        `)
        .in('cnpj_empresa', cnpjs);
      if (erroObras) {
        const mappedError = mapSupabaseErrorToHttpCode(erroObras);
        console.error(`GET /obras - Erro ${mappedError.code}:`, erroObras.message);
        throw new Error(mappedError.message);
      }

      console.log("GET /obras - Sucesso, código 200");
      setObras(
        dadosObras?.map((o) => ({
          value: o.id,
          label: o.endereco?.logradouro || 'Sem Endereço',
        })) || []
      );
    } catch (err) {
      console.error(`GET /obras - Erro ${err.code || 500}:`, err.message);
      setErro(`Erro ao carregar obras: ${mapSupabaseErrorToHttpCode(err).message}`);
      setObras([]);
    }
  };

  const carregarEpis = async (userId) => {
    try {
      console.log("GET /epis - Buscando EPIs", { userId });
      const { data: dadosEmpresas, error: erroEmpresas } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('user_id', userId);
      if (erroEmpresas) {
        const mappedError = mapSupabaseErrorToHttpCode(erroEmpresas);
        console.error(`GET /empresas - Erro ${mappedError.code}:`, erroEmpresas.message);
        throw new Error(mappedError.message);
      }

      const cnpjs = dadosEmpresas.map(emp => emp.cnpj);
      const { data: dadosObras, error: erroObras } = await supabase
        .from('obra')
        .select('id')
        .in('cnpj_empresa', cnpjs);
      if (erroObras) {
        const mappedError = mapSupabaseErrorToHttpCode(erroObras);
        console.error(`GET /obras - Erro ${mappedError.code}:`, erroObras.message);
        throw new Error(mappedError.message);
      }

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
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`GET /epis - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }

      console.log("GET /epis - Sucesso, código 200");
      setEpis(data || []);
    } catch (err) {
      console.error(`GET /epis - Erro ${err.code || 500}:`, err.message);
      setErro(`Erro ao carregar EPIs: ${mapSupabaseErrorToHttpCode(err).message}`);
    }
  };

  const alterarFiltros = (e) => {
    setFiltros({ ...filtros, [e.target.id]: e.target.value });
    if (userData.id) {
      carregarEpis(userData.id);
    }
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

  const validateFormularioEpi = (dados) => {
    const erros = [];
    if (!dados.nome) erros.push('Nome/Código é obrigatório.');
    if (!dados.tipo) erros.push('Tipo de EPI é obrigatório.');
    if (!dados.condicao) erros.push('Condição é obrigatória.');
    if (!dados.local_uso) erros.push('Local de uso é obrigatório.');
    if (!dados.disponibilidade) erros.push('Disponibilidade é obrigatória.');
    if (!dados.data_aquisicao) erros.push('Data de aquisição é obrigatória.');
    if (!dados.quantidade || dados.quantidade < 1) erros.push('Quantidade deve ser maior que 0.');
    if (!dados.obra_id) erros.push('Obra associada é obrigatória.');
    if (dados.ano_fabricacao && (dados.ano_fabricacao < 1900 || dados.ano_fabricacao > new Date().getFullYear())) {
      erros.push('Ano de fabricação deve estar entre 1900 e o ano atual.');
    }
    if (dados.validade && new Date(dados.validade) < new Date(dados.data_aquisicao)) {
      erros.push('Validade não pode ser anterior à data de aquisição.');
    }
    return erros.length > 0 ? erros.join(' ') : null;
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

    const validationError = validateFormularioEpi(dados);
    if (validationError) {
      console.error(`${ehEdicao ? 'PUT' : 'POST'} /epis - Erro 400: ${validationError}`);
      setErro(validationError);
      return;
    }

    try {
      const endpoint = ehEdicao ? 'PUT /epis' : 'POST /epis';
      console.log(`${endpoint} - Iniciando ${ehEdicao ? 'atualização' : 'criação'} de EPI`, { epiId: ehEdicao ? dadosFormulario.id : null });
      console.log("GET /obras/verify - Verificando obra", { obraId: dados.obra_id });
      const { data: obraData, error: obraError } = await supabase
        .from('obra')
        .select('id, cnpj_empresa')
        .eq('id', dados.obra_id)
        .single();
      if (obraError || !obraData) {
        const mappedError = mapSupabaseErrorToHttpCode(obraError || new Error('Obra não encontrada'));
        console.error(`GET /obras/verify - Erro ${mappedError.code}: Obra não encontrada`);
        throw new Error('Obra não encontrada.');
      }

      console.log("GET /empresas/verify - Verificando permissão da empresa", { cnpj: obraData.cnpj_empresa });
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresa')
        .select('user_id')
        .eq('cnpj', obraData.cnpj_empresa)
        .single();
      if (empresaError || empresaData.user_id !== userData.id) {
        console.error("GET /empresas/verify - Erro 403: Obra não pertence ao usuário");
        throw new Error('Obra não pertence ao usuário.');
      }

      if (ehEdicao) {
        console.log("PUT /epis - Atualizando EPI", { epiId: dadosFormulario.id });
        const { error } = await supabase.from('epis').update(dados).eq('id', dadosFormulario.id);
        if (error) {
          const mappedError = mapSupabaseErrorToHttpCode(error);
          console.error(`PUT /epis - Erro ${mappedError.code}:`, error.message);
          throw new Error(mappedError.message);
        }
        console.log("PUT /epis - Sucesso, código 204");
        setSucesso('EPI atualizado com sucesso!');
      } else {
        console.log("POST /epis - Criando EPI");
        const { error } = await supabase.from('epis').insert([dados]);
        if (error) {
          const mappedError = mapSupabaseErrorToHttpCode(error);
          console.error(`POST /epis - Erro ${mappedError.code}:`, error.message);
          throw new Error(mappedError.message);
        }
        console.log("POST /epis - Sucesso, código 201");
        setSucesso('EPI adicionado com sucesso!');
      }

      await carregarEpis(userData.id);
      setTimeout(() => {
        ehEdicao ? fecharModalEditarEpi() : fecharModalAdicionarEpi();
      }, 1000);
    } catch (err) {
      console.error(`${ehEdicao ? 'PUT' : 'POST'} /epis - Erro ${err.code || 500}:`, err.message);
      setErro(`Erro ao ${ehEdicao ? 'atualizar' : 'adicionar'} EPI: ${mapSupabaseErrorToHttpCode(err).message}`);
    }
  };

  const excluirEpi = async () => {
    setErro('');
    setSucesso('');
    try {
      console.log("DELETE /epis - Iniciando exclusão de EPI", { epiId: epiSelecionadoId });
      console.log("GET /epis/verify - Verificando EPI", { epiId: epiSelecionadoId });
      const { data: epiData, error: fetchError } = await supabase
        .from('epis')
        .select('id, obra_id, obra(id, cnpj_empresa)')
        .eq('id', epiSelecionadoId)
        .single();
      if (fetchError || !epiData) {
        const mappedError = mapSupabaseErrorToHttpCode(fetchError || new Error('EPI não encontrado'));
        console.error(`GET /epis/verify - Erro ${mappedError.code}: EPI não encontrado`);
        throw new Error('EPI não encontrado.');
      }

      console.log("GET /empresas/verify - Verificando permissão da empresa", { cnpj: epiData.obra.cnpj_empresa });
      const { data: empresaData, error: empresaError } = await supabase
        .from('empresa')
        .select('user_id')
        .eq('cnpj', epiData.obra.cnpj_empresa)
        .single();
      if (empresaError || empresaData.user_id !== userData.id) {
        console.error("GET /empresas/verify - Erro 403: EPI não pertence ao usuário");
        throw new Error('EPI não pertence ao usuário.');
      }

      console.log("DELETE /epis - Excluindo EPI", { epiId: epiSelecionadoId });
      const { error } = await supabase.from('epis').delete().eq('id', epiSelecionadoId);
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`DELETE /epis - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }

      console.log("DELETE /epis - Sucesso, código 204");
      setEpis(epis.filter((epi) => epi.id !== epiSelecionadoId));
      setSucesso('EPI excluído com sucesso!');
      fecharModalConfirmarExclusao();
      setTimeout(() => setSucesso(''), 1500);
    } catch (err) {
      console.error(`DELETE /epis - Erro ${err.code || 500}:`, err.message);
      setErro(`Erro ao excluir EPI: ${mapSupabaseErrorToHttpCode(err).message}`);
    }
  };

  const adicionarTipoEpi = async () => {
    setErro('');
    setSucesso('');
    const novoTipo = formularioGerenciar.novoTipo.trim();
    if (!novoTipo) {
      console.error("POST /tipos-epi - Erro 400: Tipo de EPI é obrigatório");
      setErro('Digite um tipo de EPI.');
      return;
    }
    if (tiposEpi.some((t) => t.label.toLowerCase() === novoTipo.toLowerCase())) {
      console.error("POST /tipos-epi - Erro 409: Tipo de EPI já existe");
      setErro('Este tipo de EPI já existe.');
      return;
    }
    console.log("POST /tipos-epi - Adicionando novo tipo de EPI", { novoTipo });
    setTiposEpi([...tiposEpi, {
      value: novoTipo.toLowerCase().replace(/\s+/g, '-'),
      label: novoTipo,
    }]);
    setFormularioGerenciar({ ...formularioGerenciar, novoTipo: '' });
    console.log("POST /tipos-epi - Sucesso, código 201");
    setSucesso('Tipo de EPI adicionado com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const adicionarLocalUso = async () => {
    setErro('');
    setSucesso('');
    const novoLocal = formularioGerenciar.novoLocal.trim();
    if (!novoLocal) {
      console.error("POST /locais-uso - Erro 400: Local de uso é obrigatório");
      setErro('Digite um local de uso.');
      return;
    }
    if (locaisUso.some((l) => l.label.toLowerCase() === novoLocal.toLowerCase())) {
      console.error("POST /locais-uso - Erro 409: Local de uso já existe");
      setErro('Este local de uso já existe.');
      return;
    }
    console.log("POST /locais-uso - Adicionando novo local de uso", { novoLocal });
    setLocaisUso([...locaisUso, {
      value: novoLocal.toLowerCase().replace(/\s+/g, '-'),
      label: novoLocal,
    }]);
    setFormularioGerenciar({ ...formularioGerenciar, novoLocal: '' });
    console.log("POST /locais-uso - Sucesso, código 201");
    setSucesso('Local de uso adicionado com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const removerTipoEpi = (indice) => {
    console.log("DELETE /tipos-epi - Removendo tipo de EPI", { indice });
    setTiposEpi(tiposEpi.filter((_, i) => i !== indice));
    console.log("DELETE /tipos-epi - Sucesso, código 204");
    setSucesso('Tipo de EPI removido com sucesso!');
    setTimeout(() => setSucesso(''), 2000);
  };

  const removerLocalUso = (indice) => {
    console.log("DELETE /locais-uso - Removendo local de uso", { indice });
    setLocaisUso(locaisUso.filter((_, i) => i !== indice));
    console.log("DELETE /locais-uso - Sucesso, código 204");
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
        <div className="dashboard-wrapper">
          <Sidebar userType={userData.tipo} userEmail={userData.email} />

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