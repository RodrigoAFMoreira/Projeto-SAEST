import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar'; 
import LoadingSpinner from './componentes/carregando';
import './css/menuEsquerdo.css';
import './css/empresaObra.css';

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
      setErrorMessage(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setErrorMessage('Usuário não está logado. Redirecionando para login...');
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

        if (data && data.tipo !== 'user') {
          await Promise.all([fetchEmpresas(), fetchObras()]);
        } else {
          setErrorMessage('Acesso não autorizado para este usuário.');
          setTimeout(() => navigate('/menu'), 2000);
        }
      } catch (err) {
        setErrorMessage('Erro ao carregar dados do usuário. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const fetchEmpresas = async () => {
    try {
      const { data, error } = await supabase.from('empresa').select('*');
      if (error) throw error;
      setEmpresas(data);
    } catch (error) {
      console.error('Erro ao carregar construtoras:', error);
      setErrorMessage(`Erro ao carregar construtoras: ${error.message}`);
    }
  };

  const fetchObras = async () => {
    try {
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
      if (error) throw error;
      setObras(data);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
      setErrorMessage(`Erro ao carregar obras: ${error.message}`);
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

    if (!formData.razao_social) return setErrorMessage('Por favor, insira a razão social.');
    if (!formData.nome_fantasia) return setErrorMessage('Por favor, insira o nome fantasia.');
    if (!formData.email) return setErrorMessage('Por favor, insira o e-mail.');
    if (!validateEmail(formData.email)) return setErrorMessage('Por favor, insira um e-mail válido.');
    if (!formData.porte) return setErrorMessage('Por favor, selecione o porte da construtora.');
    if (!formData.telefone) return setErrorMessage('Por favor, insira o telefone.');
    if (!formData.responsavel_tecnico) return setErrorMessage('Por favor, insira o responsável técnico.');
    if (!formData.cnpj) return setErrorMessage('Por favor, insira o CNPJ.');
    if (!validateCNPJ(formData.cnpj)) return setErrorMessage('Por favor, insira um CNPJ válido (ex.: 12345678000190 ou 12.345.678/0001-90).');

    try {
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
      if (error) throw error;
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
      fetchEmpresas();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao cadastrar construtora:', error);
      setErrorMessage(`Erro ao cadastrar construtora: ${error.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.razao_social) return setErrorMessage('Por favor, insira a razão social.');
    if (!formData.nome_fantasia) return setErrorMessage('Por favor, insira o nome fantasia.');
    if (!formData.email) return setErrorMessage('Por favor, insira o e-mail.');
    if (!validateEmail(formData.email)) return setErrorMessage('Por favor, insira um e-mail válido.');
    if (!formData.porte) return setErrorMessage('Por favor, selecione o porte da construtora.');
    if (!formData.telefone) return setErrorMessage('Por favor, insira o telefone.');
    if (!formData.responsavel_tecnico) return setErrorMessage('Por favor, insira o responsável técnico.');
    if (!formData.cnpj) return setErrorMessage('Por favor, insira o CNPJ.');
    if (!validateCNPJ(formData.cnpj)) return setErrorMessage('Por favor, insira um CNPJ válido (ex.: 12345678000190 ou 12.345.678/0001-90).');

    try {
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
      if (error) throw error;
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
      fetchEmpresas();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar construtora:', error);
      setErrorMessage(`Erro ao atualizar construtora: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('empresa').delete().eq('cnpj', deleteEmpresa.cnpj);
      if (error) throw error;
      fetchEmpresas();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Erro ao remover construtora:', error);
      setErrorMessage(`Erro ao remover construtora: ${error.message}`);
    }
  };

  const editEmpresa = async (cnpj) => {
    try {
      const { data, error } = await supabase
        .from('empresa')
        .select('*')
        .eq('cnpj', cnpj)
        .single();
      if (error) throw error;
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
      console.error('Erro ao buscar dados da construtora para edição:', error);
      setErrorMessage(`Erro ao preparar edição: ${error.message}`);
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
                          <td>
                            <button title="Editar" onClick={() => editEmpresa(empresa.cnpj)}>
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              title="Expandir"
                              className="expand-btn"
                              onClick={() => toggleExpandRow(empresa.cnpj)}
                            >
                              <i
                                className={
                                  expandedRow === empresa.cnpj
                                    ? 'ri-arrow-up-s-line'
                                    : 'ri-arrow-down-s-line'
                                }
                              ></i>
                            </button>
                            <button
                              title="Deletar"
                              onClick={() =>
                                setDeleteEmpresa({
                                  cnpj: empresa.cnpj,
                                  razao_social: empresa.razao_social,
                                })
                              }
                            >
                              <i className="ri-delete-bin-line"></i>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default Empresa;