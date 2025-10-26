// Elemento de gerenciamento de construtoras e suas obras, incluindo criação, edição, remoção e 
// listagem com filtros e detalhes expandidos

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar';
import LoadingSpinner from './componentes/carregando';
import './css/menuEsquerdo.css';
import './css/empresa.css';

const mapSupabaseErrorToHttpCode = (error) => {
  if (!error) return { code: 500, message: "Erro interno desconhecido no servidor." };

  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("invalid login") || errorMessage.includes("email not confirmed")) {
    return { code: 401, message: "Credenciais inválidas ou e-mail não verificado." };
  }
  if (errorMessage.includes("duplicate key") || errorMessage.includes("already exists")) {
    return { code: 409, message: "CNPJ já registrado." };
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

const Empresa = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const [empresas, setEmpresas] = useState([]);
  const [obras, setObras] = useState([]);
  const [filter, setFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editEmpresaCnpj, setEditEmpresaCnpj] = useState(null);
  const [deleteEmpresa, setDeleteEmpresa] = useState({ cnpj: null, razao_social: '' });
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    email: '',
    telefone: '',
    porte: '',
    responsavel_tecnico: '',
    cnpj: '',
    nacionalidade: '',
    user_id: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setErrorMessage('');
      try {
        console.log("GET /auth/user - Obtendo dados do usuário");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("GET /auth/user - Erro 401: Usuário não autenticado", authError?.message);
          setErrorMessage('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setUser(user);

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

        if (data && data.tipo !== 'user') {
          await Promise.all([fetchEmpresas(user.id), fetchObras()]);
        } else {
          console.warn("GET /usuarios - Erro 403: Acesso não autorizado para tipo 'user'");
          setErrorMessage('Acesso não autorizado para este usuário.');
          setTimeout(() => navigate('/menu'), 2000);
        }
      } catch (err) {
        console.error(`GET /auth/user - Erro ${mapSupabaseErrorToHttpCode(err).code}:`, err.message);
        setErrorMessage(`Erro ao carregar dados do usuário: ${mapSupabaseErrorToHttpCode(err).message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const fetchEmpresas = async (userId) => {
    try {
      console.log("GET /empresas - Buscando empresas", { userId });
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .eq('user_id', userId);
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`GET /empresas - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("GET /empresas - Sucesso, código 200");
      setEmpresas(data);
    } catch (error) {
      console.error(`GET /empresas - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao carregar construtoras: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const fetchObras = async () => {
    try {
      console.log("GET /obras - Buscando obras");
      const { data, error } = await supabase
        .from('obra')
        .select(`
          *,
          endereco (
            logradouro,
            numero,
            complemento,
            bairro,
            cidade,
            uf,
            cep
          )
        `);
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`GET /obras - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("GET /obras - Sucesso, código 200");
      setObras(data);
    } catch (error) {
      console.error(`GET /obras - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao carregar obras: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const validateCNPJ = (cnpj) => {
    const cleanCnpj = cnpj.replace(/[\.\-\/]/g, '');
    const cnpjRegex = /^\d{14}$/;
    return cnpjRegex.test(cleanCnpj);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const cleanCnpj = (cnpj) => {
    return cnpj.replace(/[\.\-\/]/g, '');
  };

  const handleCnpjChange = (e) => {
    setFormData({ ...formData, cnpj: e.target.value });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.razao_social) {
      console.error("POST /empresas - Erro 400: Razão social é obrigatória");
      setErrorMessage('Por favor, insira a razão social.');
      return;
    }
    if (!formData.nome_fantasia) {
      console.error("POST /empresas - Erro 400: Nome fantasia é obrigatório");
      setErrorMessage('Por favor, insira o nome fantasia.');
      return;
    }
    if (!formData.email) {
      console.error("POST /empresas - Erro 400: E-mail é obrigatório");
      setErrorMessage('Por favor, insira o e-mail.');
      return;
    }
    if (!validateEmail(formData.email)) {
      console.error("POST /empresas - Erro 400: E-mail inválido");
      setErrorMessage('Por favor, insira um e-mail válido.');
      return;
    }
    if (!formData.porte) {
      console.error("POST /empresas - Erro 400: Porte é obrigatório");
      setErrorMessage('Por favor, selecione o porte da construtora.');
      return;
    }
    if (!formData.telefone) {
      console.error("POST /empresas - Erro 400: Telefone é obrigatório");
      setErrorMessage('Por favor, insira o telefone.');
      return;
    }
    if (!formData.responsavel_tecnico) {
      console.error("POST /empresas - Erro 400: Responsável técnico é obrigatório");
      setErrorMessage('Por favor, insira o responsável técnico.');
      return;
    }
    if (!formData.cnpj) {
      console.error("POST /empresas - Erro 400: CNPJ é obrigatório");
      setErrorMessage('Por favor, insira o CNPJ.');
      return;
    }
    if (!validateCNPJ(formData.cnpj)) {
      console.error("POST /empresas - Erro 400: CNPJ inválido");
      setErrorMessage('Por favor, insira um CNPJ válido (ex.: 12345678000190 ou 12.345.678/0001-90).');
      return;
    }

    try {
      console.log("POST /empresas - Iniciando criação de empresa", { cnpj: formData.cnpj });
      const cleanedCnpj = cleanCnpj(formData.cnpj);
      const { error } = await supabase.from('empresa').insert([
        {
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          email: formData.email,
          telefone: formData.telefone,
          porte: formData.porte,
          responsavel_tecnico: formData.responsavel_tecnico,
          cnpj: cleanedCnpj,
          nacionalidade: formData.nacionalidade,
          user_id: user?.id,
        },
      ]);
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /empresas - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("POST /empresas - Sucesso, código 201");
      setSuccessMessage('Construtora cadastrada com sucesso!');
      setFormData({
        razao_social: '',
        nome_fantasia: '',
        email: '',
        telefone: '',
        porte: '',
        responsavel_tecnico: '',
        cnpj: '',
        nacionalidade: '',
        user_id: user?.id || '',
      });
      await fetchEmpresas(user.id);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      console.error(`POST /empresas - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao cadastrar construtora: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.razao_social) {
      console.error("PUT /empresas - Erro 400: Razão social é obrigatória");
      setErrorMessage('Por favor, insira a razão social.');
      return;
    }
    if (!formData.nome_fantasia) {
      console.error("PUT /empresas - Erro 400: Nome fantasia é obrigatório");
      setErrorMessage('Por favor, insira o nome fantasia.');
      return;
    }
    if (!formData.email) {
      console.error("PUT /empresas - Erro 400: E-mail é obrigatório");
      setErrorMessage('Por favor, insira o e-mail.');
      return;
    }
    if (!validateEmail(formData.email)) {
      console.error("PUT /empresas - Erro 400: E-mail inválido");
      setErrorMessage('Por favor, insira um e-mail válido.');
      return;
    }
    if (!formData.porte) {
      console.error("PUT /empresas - Erro 400: Porte é obrigatório");
      setErrorMessage('Por favor, selecione o porte da construtora.');
      return;
    }
    if (!formData.telefone) {
      console.error("PUT /empresas - Erro 400: Telefone é obrigatório");
      setErrorMessage('Por favor, insira o telefone.');
      return;
    }
    if (!formData.responsavel_tecnico) {
      console.error("PUT /empresas - Erro 400: Responsável técnico é obrigatório");
      setErrorMessage('Por favor, insira o responsável técnico.');
      return;
    }
    if (!formData.cnpj) {
      console.error("PUT /empresas - Erro 400: CNPJ é obrigatório");
      setErrorMessage('Por favor, insira o CNPJ.');
      return;
    }
    if (!validateCNPJ(formData.cnpj)) {
      console.error("PUT /empresas - Erro 400: CNPJ inválido");
      setErrorMessage('Por favor, insira um CNPJ válido (ex.: 12345678000190 ou 12.345.678/0001-90).');
      return;
    }

    try {
      console.log("PUT /empresas - Iniciando atualização de empresa", { cnpj: formData.cnpj });
      const cleanedCnpj = cleanCnpj(formData.cnpj);
      const { error } = await supabase
        .from('empresa')
        .update({
          razao_social: formData.razao_social,
          nome_fantasia: formData.nome_fantasia,
          email: formData.email,
          telefone: formData.telefone,
          porte: formData.porte,
          responsavel_tecnico: formData.responsavel_tecnico,
          cnpj: cleanedCnpj,
          nacionalidade: formData.nacionalidade,
          user_id: user?.id,
        })
        .eq('cnpj', editEmpresaCnpj);
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`PUT /empresas - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("PUT /empresas - Sucesso, código 204");
      setSuccessMessage('Construtora atualizada com sucesso!');
      setFormData({
        razao_social: '',
        nome_fantasia: '',
        email: '',
        telefone: '',
        porte: '',
        responsavel_tecnico: '',
        cnpj: '',
        nacionalidade: '',
        user_id: user?.id || '',
      });
      await fetchEmpresas(user.id);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      console.error(`PUT /empresas - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao atualizar construtora: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const handleDelete = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    try {
      console.log("DELETE /empresas - Iniciando exclusão de empresa", { cnpj: deleteEmpresa.cnpj });
      console.log("GET /empresas/verify - Verificando permissão", { cnpj: deleteEmpresa.cnpj });
      const { data: empresaData, error: fetchError } = await supabase
        .from('empresa')
        .select('user_id')
        .eq('cnpj', deleteEmpresa.cnpj)
        .single();
      if (fetchError) {
        const mappedError = mapSupabaseErrorToHttpCode(fetchError);
        console.error(`GET /empresas/verify - Erro ${mappedError.code}:`, fetchError.message);
        throw new Error('Erro ao buscar dados da construtora.');
      }
      if (empresaData.user_id !== user.id) {
        console.error("DELETE /empresas - Erro 403: Acesso não autorizado");
        throw new Error('Acesso não autorizado para excluir esta construtora.');
      }

      console.log("GET /obras/verify - Verificando obras relacionadas", { cnpj: deleteEmpresa.cnpj });
      const { data: obrasData, error: obrasError } = await supabase
        .from('obra')
        .select('id')
        .eq('cnpj_empresa', deleteEmpresa.cnpj);
      if (obrasError) {
        const mappedError = mapSupabaseErrorToHttpCode(obrasError);
        console.error(`GET /obras/verify - Erro ${mappedError.code}:`, obrasError.message);
        throw new Error('Erro ao verificar obras relacionadas.');
      }
      if (obrasData.length > 0) {
        console.error("DELETE /empresas - Erro 400: Empresa possui obras relacionadas");
        throw new Error('Não é possível excluir a construtora, pois ela possui obras relacionadas.');
      }
      const { error: deleteError } = await supabase
        .from('empresa')
        .delete()
        .eq('cnpj', deleteEmpresa.cnpj);
      if (deleteError) {
        const mappedError = mapSupabaseErrorToHttpCode(deleteError);
        console.error(`DELETE /empresas - Erro ${mappedError.code}:`, deleteError.message);
        throw new Error('Erro ao excluir construtora.');
      }

      console.log("DELETE /empresas - Sucesso, código 204");
      await fetchEmpresas(user.id);
      setIsDeleteModalOpen(false);
      setSuccessMessage('Construtora removida com sucesso!');
      setTimeout(() => setSuccessMessage(''), 1500);
    } catch (error) {
      console.error(`DELETE /empresas - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao remover construtora: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const editEmpresa = async (cnpj) => {
    try {
      console.log("GET /empresas/edit - Preparando edição de empresa", { cnpj });
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .eq('cnpj', cnpj)
        .single();
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`GET /empresas/edit - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("GET /empresas/edit - Sucesso, código 200");
      setFormData({
        razao_social: data.razao_social || '',
        nome_fantasia: data.nome_fantasia || '',
        email: data.email || '',
        telefone: data.telefone || '',
        porte: data.porte || '',
        responsavel_tecnico: data.responsavel_tecnico || '',
        cnpj: data.cnpj || '',
        nacionalidade: data.nacionalidade || '',
        user_id: data.user_id || user?.id || '',
      });
      setEditEmpresaCnpj(cnpj);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error(`GET /empresas/edit - Erro ${error.code || 500}:`, error.message);
      setErrorMessage(`Erro ao preparar edição: ${mapSupabaseErrorToHttpCode(error).message}`);
    }
  };

  const toggleExpandRow = (cnpj) => {
    setExpandedRow(expandedRow === cnpj ? null : cnpj);
  };

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const filteredEmpresas = empresas.filter((empresa) =>
    empresa.razao_social.toLowerCase().includes(filter.toLowerCase())
  );

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
      ) : errorMessage ? (
        <ErrorMessage message={errorMessage} onRetry={() => window.location.reload()} />
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
          <main className="main-content">
            <header className="main-header">
              <i className="ri-notification-3-line"></i>
            </header>
            <section className="content-box">
              <div className="content-header">
                <h2>Construtoras</h2>
                <div className="actions">
                  <input
                    type="text"
                    placeholder="Pesquisar por nome"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <button className="btn primary" onClick={() => setIsModalOpen(true)}>
                    <i className="ri-add-line"></i> Cadastrar Construtora
                  </button>
                </div>
              </div>
              <table className="empresa-table">
                <thead>
                  <tr>
                    <th>Construtora</th>
                    <th>Obras Relacionadas</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmpresas.length === 0 ? (
                    <tr>
                      <td colSpan="3">Nenhuma construtora encontrada.</td>
                    </tr>
                  ) : (
                    filteredEmpresas.map((empresa) => (
                      <React.Fragment key={empresa.cnpj}>
                        <tr data-cnpj={empresa.cnpj}>
                          <td>{empresa.razao_social || 'Nome não disponível'}</td>
                          <td>
                            {obras
                              .filter((obra) => obra.cnpj_empresa === empresa.cnpj)
                              .map((obra) => (
                                <div key={obra.id}>
                                  {obra.endereco
                                    ? `${obra.endereco.logradouro}, ${obra.endereco.numero || ''}, ${obra.endereco.cidade} - ${obra.endereco.uf}`
                                    : 'Endereço não disponível'} (Status: {obra.status || 'ativo'})
                                </div>
                              ))}
                            {obras.filter((obra) => obra.cnpj_empresa === empresa.cnpj).length === 0 &&
                              'Nenhuma obra relacionada'}
                          </td>
                          <td className="action-buttons">
                            <button className="edit-btn" title="Editar" onClick={() => editEmpresa(empresa.cnpj)}>
                              <i className="ri-edit-line"></i> Editar
                            </button>
                            <button
                              className="expand-btn"
                              title="Expandir"
                              onClick={() => toggleExpandRow(empresa.cnpj)}
                            >
                              <i
                                className={
                                  expandedRow === empresa.cnpj
                                    ? 'ri-arrow-up-s-line'
                                    : 'ri-arrow-down-s-line'
                                }
                              ></i>
                              {expandedRow === empresa.cnpj ? 'Recolher' : 'Expandir'}
                            </button>
                            <button
                              className="delete-btn"
                              title="Deletar"
                              onClick={() => {
                                setDeleteEmpresa({
                                  cnpj: empresa.cnpj,
                                  razao_social: empresa.razao_social,
                                });
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <i className="ri-delete-bin-line"></i> Deletar
                            </button>
                          </td>
                        </tr>
                        {expandedRow === empresa.cnpj && (
                          <tr className="expanded-row" data-cnpj={empresa.cnpj}>
                            <td colSpan="3">
                              <div className="expanded-details">
                                <p>
                                  <strong>Nome Fantasia:</strong> {empresa.nome_fantasia || 'N/A'}
                                </p>
                                <p>
                                  <strong>E-mail:</strong> {empresa.email || 'N/A'}
                                </p>
                                <p>
                                  <strong>Porte da Construtora:</strong> {empresa.porte || 'N/A'}
                                </p>
                                <p>
                                  <strong>Telefone:</strong> {empresa.telefone || 'N/A'}
                                </p>
                                <p>
                                  <strong>Responsável Técnico:</strong>{' '}
                                  {empresa.responsavel_tecnico || 'N/A'}
                                </p>
                                <p>
                                  <strong>CNPJ:</strong> {empresa.cnpj || 'N/A'}
                                </p>
                                <p>
                                  <strong>Nacionalidade:</strong> {empresa.nacionalidade || 'N/A'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </section>
          </main>
        </div>
      ) : null}

      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-labelledby="modal-create-title">
          <div className="modal">
            <button
              className="modal-close"
              aria-label="Fechar modal"
              onClick={() => {
                setIsModalOpen(false);
                setFormData({
                  razao_social: '',
                  nome_fantasia: '',
                  email: '',
                  telefone: '',
                  porte: '',
                  responsavel_tecnico: '',
                  cnpj: '',
                  nacionalidade: '',
                  user_id: user?.id || '',
                });
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-create-title">Cadastrar Construtora</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="razao-social">Razão Social</label>
                  <input
                    type="text"
                    id="razao-social"
                    name="razao-social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nome-fantasia">Nome Fantasia</label>
                  <input
                    type="text"
                    id="nome-fantasia"
                    name="nome-fantasia"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">E-mail</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefone">Telefone</label>
                  <input
                    type="tel"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="porte">Porte da Construtora</label>
                  <select
                    id="porte"
                    name="porte"
                    value={formData.porte}
                    onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="mei">MEI</option>
                    <option value="epp">EPP</option>
                    <option value="medio">Médio Porte</option>
                    <option value="grande">Grande Porte</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="responsavel-tecnico">Responsável Técnico</label>
                  <input
                    type="text"
                    id="responsavel-tecnico"
                    name="responsavel-tecnico"
                    value={formData.responsavel_tecnico}
                    onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cnpj">CNPJ</label>
                  <input
                    type="text"
                    id="cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                    placeholder="Ex.: 12.345.678/0001-90"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nacionalidade">Nacionalidade</label>
                  <input
                    type="text"
                    id="nacionalidade"
                    name="nacionalidade"
                    value={formData.nacionalidade}
                    onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      razao_social: '',
                      nome_fantasia: '',
                      email: '',
                      telefone: '',
                      porte: '',
                      responsavel_tecnico: '',
                      cnpj: '',
                      nacionalidade: '',
                      user_id: user?.id || '',
                    });
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  Cadastrar
                </button>
              </div>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" role="dialog" aria-labelledby="modal-edit-title">
          <div className="modal">
            <button
              className="modal-close"
              aria-label="Fechar modal"
              onClick={() => {
                setIsEditModalOpen(false);
                setFormData({
                  razao_social: '',
                  nome_fantasia: '',
                  email: '',
                  telefone: '',
                  porte: '',
                  responsavel_tecnico: '',
                  cnpj: '',
                  nacionalidade: '',
                  user_id: user?.id || '',
                });
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-edit-title">Editar Construtora</h2>
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" id="edit-empresa-cnpj" name="empresa-cnpj" value={editEmpresaCnpj} />
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-razao-social">Razão Social</label>
                  <input
                    type="text"
                    id="edit-razao-social"
                    name="razao-social"
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-nome-fantasia">Nome Fantasia</label>
                  <input
                    type="text"
                    id="edit-nome-fantasia"
                    name="nome-fantasia"
                    value={formData.nome_fantasia}
                    onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-email">E-mail</label>
                  <input
                    type="email"
                    id="edit-email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-telefone">Telefone</label>
                  <input
                    type="tel"
                    id="edit-telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-porte">Porte da Construtora</label>
                  <select
                    id="edit-porte"
                    name="porte"
                    value={formData.porte}
                    onChange={(e) => setFormData({ ...formData, porte: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="mei">MEI</option>
                    <option value="epp">EPP</option>
                    <option value="medio">Médio Porte</option>
                    <option value="grande">Grande Porte</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-responsavel-tecnico">Responsável Técnico</label>
                  <input
                    type="text"
                    id="edit-responsavel-tecnico"
                    name="responsavel-tecnico"
                    value={formData.responsavel_tecnico}
                    onChange={(e) => setFormData({ ...formData, responsavel_tecnico: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-cnpj">CNPJ</label>
                  <input
                    type="text"
                    id="edit-cnpj"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                    required
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-nacionalidade">Nacionalidade</label>
                  <input
                    type="text"
                    id="edit-nacionalidade"
                    name="nacionalidade"
                    value={formData.nacionalidade}
                    onChange={(e) => setFormData({ ...formData, nacionalidade: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setFormData({
                      razao_social: '',
                      nome_fantasia: '',
                      email: '',
                      telefone: '',
                      porte: '',
                      responsavel_tecnico: '',
                      cnpj: '',
                      nacionalidade: '',
                      user_id: user?.id || '',
                    });
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-btn">
                  Salvar
                </button>
              </div>
              {errorMessage && <div className="error-message">{errorMessage}</div>}
              {successMessage && <div className="success-message">{successMessage}</div>}
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="modal-overlay" role="dialog" aria-labelledby="modal-delete-title">
          <div className="modal">
            <button
              className="modal-close"
              aria-label="Fechar modal"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-delete-title">Confirmar Exclusão</h2>
            <p>
              Tem certeza que deseja remover a construtora "<span>{deleteEmpresa.razao_social}</span>"?
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancelar
              </button>
              <button type="button" className="save-btn" onClick={handleDelete}>
                Confirmar
              </button>
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Empresa;