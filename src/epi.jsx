// src/epi.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar';
import EpiFiltro from './componentes/epiFiltro';
import TabelaEpi from './componentes/epiTable';
import ModalFormularioEpi from './componentes/epiFormModal';
import ModalGerenciarOpcoes from './componentes/opcoesModal';
import ModalConfirmacao from './componentes/confirmModal';
import '../src/css/epi.css';

const Epi = () => {
  const navegar = useNavigate();
  const localizacao = useLocation();
  const [epis, definirEpis] = useState([]);
  const [filtros, definirFiltros] = useState({
    'filtro-tipo': '',
    'filtro-condicao': '',
    'filtro-local-uso': '',
    'filtro-disponibilidade': '',
    'filtro-validade': '',
    'filtro-codigo': '',
  });
  const [exibirModalAdicionar, definirExibirModalAdicionar] = useState(false);
  const [exibirModalEditar, definirExibirModalEditar] = useState(false);
  const [exibirModalGerenciar, definirExibirModalGerenciar] = useState(false);
  const [exibirModalConfirmacao, definirExibirModalConfirmacao] = useState(false);
  const [epiSelecionadoId, definirEpiSelecionadoId] = useState(null);
  const [linhasExpandidas, definirLinhasExpandidas] = useState([]);
  const [tiposEpi, definirTiposEpi] = useState([
    { value: 'capacete', label: 'Capacete' },
    { value: 'luvas', label: 'Luvas' },
    { value: 'botas', label: 'Botas' },
    { value: 'mascara', label: 'Máscara' },
    { value: 'oculos', label: 'Óculos de Proteção' },
  ]);
  const [locaisUso, definirLocaisUso] = useState([
    { value: 'canteiro', label: 'Canteiro de Obras' },
    { value: 'armazem', label: 'Armazém' },
    { value: 'escritorio', label: 'Escritório' },
    { value: 'manutencao', label: 'Manutenção' },
  ]);
  const [obras, definirObras] = useState([]);
  const [dadosFormulario, definirDadosFormulario] = useState({});
  const [formularioGerenciar, definirFormularioGerenciar] = useState({ novoTipo: '', novoLocal: '' });
  const [erro, definirErro] = useState('');
  const [sucesso, definirSucesso] = useState('');
  const [estaAutenticado, definirEstaAutenticado] = useState(null);
  const [carregando, definirCarregando] = useState(true);

  const hoje = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let ouvinteAutenticacao = null;

    const carregarDados = async () => {
      definirCarregando(true);
      try {
        ouvinteAutenticacao = supabase.auth.onAuthStateChange((evento, sessao) => {
          const autenticado = !!sessao;
          definirEstaAutenticado(autenticado);
          if (!autenticado) {
            navegar('/login', { state: { from: localizacao } });
          }
        });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          definirEstaAutenticado(false);
          navegar('/login', { state: { from: localizacao } });
          return;
        }
        definirEstaAutenticado(true);

        const { data: dadosObras, error: erroObras } = await supabase
          .from('obras')
          .select('id');
        if (erroObras) {
          console.error('Erro ao carregar obras:', erroObras);
          definirObras([]); 
        } else {
          definirObras(
            dadosObras?.map((o) => ({
              value: o.id,
              label: `Obra ${o.id}`, // Fallback label
            })) || []
          );
        }

        await carregarEpis();
      } catch (err) {
        definirErro('Erro ao carregar dados: ' + (err.message || 'Erro desconhecido.'));
      } finally {
        definirCarregando(false);
      }
    };

    carregarDados();

    return () => {
      if (ouvinteAutenticacao?.subscription) {
        ouvinteAutenticacao.subscription.unsubscribe();
      }
    };
  }, [navegar, localizacao]);

  const carregarEpis = async () => {
    try {
      let consulta = supabase.from('epis').select('*');
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
      definirEpis(data || []);
    } catch (err) {
      definirErro('Erro ao carregar EPIs: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  useEffect(() => {
    if (estaAutenticado) {
      carregarEpis();
    }
  }, [filtros, estaAutenticado]);

  const alterarFiltros = (e) => {
    definirFiltros({ ...filtros, [e.target.id]: e.target.value });
  };

  const abrirModalAdicionarEpi = () => {
    definirDadosFormulario({});
    definirExibirModalAdicionar(true);
    definirErro('');
    definirSucesso('');
  };

  const fecharModalAdicionarEpi = () => {
    definirExibirModalAdicionar(false);
    definirErro('');
    definirSucesso('');
  };

  const abrirModalEditarEpi = (epi) => {
    definirDadosFormulario(epi);
    definirExibirModalEditar(true);
    definirErro('');
    definirSucesso('');
  };

  const fecharModalEditarEpi = () => {
    definirExibirModalEditar(false);
    definirErro('');
    definirSucesso('');
  };

  const abrirModalGerenciarOpcoes = () => {
    definirExibirModalGerenciar(true);
    definirErro('');
    definirSucesso('');
  };

  const fecharModalGerenciarOpcoes = () => {
    definirExibirModalGerenciar(false);
    definirFormularioGerenciar({ novoTipo: '', novoLocal: '' });
    definirErro('');
    definirSucesso('');
  };

  const abrirModalConfirmarExclusao = (epiId) => {
    definirEpiSelecionadoId(epiId);
    definirExibirModalConfirmacao(true);
  };

  const fecharModalConfirmarExclusao = () => {
    definirExibirModalConfirmacao(false);
    definirEpiSelecionadoId(null);
  };

  const alterarFormularioEpi = (e) => {
    definirDadosFormulario({ ...dadosFormulario, [e.target.id]: e.target.value });
  };

  const alterarFormularioGerenciar = (e) => {
    definirFormularioGerenciar({ ...formularioGerenciar, [e.target.id]: e.target.value });
  };

  const enviarFormularioEpi = async (e, ehEdicao = false) => {
    e.preventDefault();
    definirErro('');
    definirSucesso('');

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
      // obra_id: dadosFormulario.obra_id, // 
    };

    const erros = [];
    if (!dados.nome) erros.push('Nome/Código é obrigatório.');
    if (!dados.tipo) erros.push('Tipo de EPI é obrigatório.');
    if (!dados.condicao) erros.push('Condição é obrigatória.');
    if (!dados.local_uso) erros.push('Local de uso é obrigatório.');
    if (!dados.disponibilidade) erros.push('Disponibilidade é obrigatória.');
    if (!dados.data_aquisicao) erros.push('Data de aquisição é obrigatória.');
    if (!dados.quantidade || dados.quantidade < 1) erros.push('Quantidade deve ser maior que 0.');
    // if (!dados.obra_id) erros.push('Obra associada é obrigatória.'); 

    if (erros.length > 0) {
      definirErro(erros.join(' '));
      return;
    }

    try {
      if (ehEdicao) {
        await supabase.from('epis').update(dados).eq('id', dadosFormulario.id);
        definirSucesso('EPI atualizado com sucesso!');
      } else {
        await supabase.from('epis').insert([dados]);
        definirSucesso('EPI adicionado com sucesso!');
      }
      await carregarEpis();
      setTimeout(() => {
        ehEdicao ? fecharModalEditarEpi() : fecharModalAdicionarEpi();
      }, 1000);
    } catch (err) {
      definirErro('Erro: ' + (err.message || 'Falha ao salvar EPI.'));
    }
  };

  const excluirEpi = async () => {
    try {
      await supabase.from('epis').delete().eq('id', epiSelecionadoId);
      definirEpis(epis.filter((epi) => epi.id !== epiSelecionadoId));
      fecharModalConfirmarExclusao();
    } catch (err) {
      definirErro('Erro ao excluir EPI: ' + (err.message || 'Erro desconhecido.'));
    }
  };

  const adicionarTipoEpi = async () => {
    const novoTipo = formularioGerenciar.novoTipo.trim();
    if (!novoTipo) {
      definirErro('Digite um tipo de EPI.');
      return;
    }
    if (tiposEpi.some((t) => t.label.toLowerCase() === novoTipo.toLowerCase())) {
      definirErro('Este tipo de EPI já existe.');
      return;
    }
    definirTiposEpi([...tiposEpi, {
      value: novoTipo.toLowerCase().replace(/\s+/g, '-'),
      label: novoTipo,
    }]);
    definirFormularioGerenciar({ ...formularioGerenciar, novoTipo: '' });
    definirSucesso('Tipo de EPI adicionado com sucesso!');
    setTimeout(() => definirSucesso(''), 2000);
  };

  const adicionarLocalUso = async () => {
    const novoLocal = formularioGerenciar.novoLocal.trim();
    if (!novoLocal) {
      definirErro('Digite um local de uso.');
      return;
    }
    if (locaisUso.some((l) => l.label.toLowerCase() === novoLocal.toLowerCase())) {
      definirErro('Este local de uso já existe.');
      return;
    }
    definirLocaisUso([...locaisUso, {
      value: novoLocal.toLowerCase().replace(/\s+/g, '-'),
      label: novoLocal,
    }]);
    definirFormularioGerenciar({ ...formularioGerenciar, novoLocal: '' });
    definirSucesso('Local de uso adicionado com sucesso!');
    setTimeout(() => definirSucesso(''), 2000);
  };

  const removerTipoEpi = (indice) => {
    definirTiposEpi(tiposEpi.filter((_, i) => i !== indice));
    definirSucesso('Tipo de EPI removido com sucesso!');
    setTimeout(() => definirSucesso(''), 2000);
  };

  const removerLocalUso = (indice) => {
    definirLocaisUso(locaisUso.filter((_, i) => i !== indice));
    definirSucesso('Local de uso removido com sucesso!');
    setTimeout(() => definirSucesso(''), 2000);
  };

  const alternarExpansao = (epiId) => {
    definirLinhasExpandidas((anterior) =>
      anterior.includes(epiId) ? anterior.filter((id) => id !== epiId) : [...anterior, epiId]
    );
  };

  if (estaAutenticado === null || carregando) {
    return (
      <div className="container">
        <Sidebar />
        <main className="main-content">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando...</p>
          </div>
        </main>
      </div>
    );
  }

  if (estaAutenticado === false) {
    return null;
  }

  return (
    <div className="container">
      <Sidebar />
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
  );
};

export default Epi;