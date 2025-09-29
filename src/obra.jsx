// Elemento de gerenciamento de obras, incluindo criação, edição, remoção e listagem com filtros e detalhes expandidos

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar'; 
import LoadingSpinner from './componentes/carregando'; 
import './css/menuEsquerdo.css';
import './css/empresaObra.css';

const Obra = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const [obras, setObras] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editObraId, setEditObraId] = useState(null);
  const [deleteObra, setDeleteObra] = useState({ id: null, endereco: '' });
  const [formData, setFormData] = useState({
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    status: '',
    data_inicio: '',
    data_termino: '',
    responsavel_tecnico: '',
    alvara: null,
    registro_crea: null,
    registro_cal: null,
    cnpj_empresa: '',
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
          await Promise.all([fetchObras(), fetchEmpresas()]);
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
      const { data, error } = await supabase
        .from('empresa')
        .select('cnpj, razao_social');
      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setErrorMessage(`Erro ao carregar empresas: ${error.message}`);
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
          ),
          empresa (razao_social),
          obras_documentos (alvara, registro_crea, registro_cal)
        `);
      if (error) throw error;
      setObras(data);
    } catch (error) {
      console.error('Erro ao carregar obras:', error);
      setErrorMessage(`Erro ao carregar obras: ${error.message}`);
    }
  };

  const validateCep = (cep) => {
    const cepRegex = /^\d{5}-\d{3}$/;
    return cepRegex.test(cep);
  };

  const validateUf = (uf) => {
    const ufRegex = /^[A-Z]{2}$/;
    return ufRegex.test(uf);
  };

  const validateNumero = (numero) => {
    if (numero === '') return true;
    const numeroRegex = /^\d+$/;
    return numeroRegex.test(numero);
  };

  const formatCepForDb = (cep) => {
    return cep.replace(/\D/g, '');
  };

  const formatCepForDisplay = (cep) => {
    if (!cep) return '';
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      return `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}`;
    }
    return cep;
  };

  const cleanCnpj = (cnpj) => {
    return cnpj.replace(/[\.\-\/]/g, '');
  };

  const formatCnpjForDisplay = (cnpj) => {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
    }
    setFormData({ ...formData, cep: value });
  };

  const handleNumeroChange = (e) => {
    const value = e.target.value;
    if (value === '' || validateNumero(value)) {
      setFormData({ ...formData, numero: value });
    }
  };

  const uploadFileToSupabase = async (file, fileName) => {
    if (!file) return null;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`obras/${fileName}_${Date.now()}.pdf`, file, {
        contentType: 'application/pdf',
      });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.logradouro) return setErrorMessage('Por favor, insira o logradouro.');
    if (!formData.cidade) return setErrorMessage('Por favor, insira a cidade.');
    if (!formData.uf) return setErrorMessage('Por favor, insira a UF.');
    if (!validateUf(formData.uf)) return setErrorMessage('Por favor, insira uma UF válida (ex.: SP).');
    if (formData.cep && !validateCep(formData.cep)) return setErrorMessage('Por favor, insira um CEP válido (ex.: 12345-678).');
    if (formData.numero && !validateNumero(formData.numero)) return setErrorMessage('O número deve conter apenas dígitos.');
    if (!formData.status) return setErrorMessage('Por favor, selecione o status.');
    if (!formData.data_inicio) return setErrorMessage('Por favor, insira a data de início.');
    if (!formData.responsavel_tecnico) return setErrorMessage('Por favor, insira o responsável técnico.');
    if (!formData.alvara) return setErrorMessage('Por favor, selecione um arquivo PDF para o alvará.');
    if (!formData.registro_crea) return setErrorMessage('Por favor, selecione um arquivo PDF para o registro CREA.');
    if (!formData.registro_cal) return setErrorMessage('Por favor, selecione um arquivo PDF para o registro CAL.');
    if (!formData.cnpj_empresa) return setErrorMessage('Por favor, selecione uma construtora.');
    if (empresas.length === 0) return setErrorMessage('Nenhuma construtora disponível. Cadastre uma construtora primeiro.');

    const inicio = new Date(formData.data_inicio);
    const anoInicio = inicio.getFullYear();
    if (anoInicio < 1950 || anoInicio > 2050) {
      return setErrorMessage('A data de início deve estar entre 1950 e 2050.');
    }
    if (formData.data_termino) {
      const termino = new Date(formData.data_termino);
      const anoTermino = termino.getFullYear();
      if (anoTermino < 1950 || anoTermino > 2050) {
        return setErrorMessage('A data de término deve estar entre 1950 e 2050.');
      }
      if (termino < inicio) {
        return setErrorMessage('A data de término não pode ser anterior à data de início.');
      }
    }

    try {
      const cleanedCnpj = cleanCnpj(formData.cnpj_empresa);
      const { data: empresaExists, error: empresaError } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('cnpj', cleanedCnpj)
        .single();
      if (empresaError || !empresaExists) throw new Error('Construtora não encontrada.');

      const alvaraUrl = await uploadFileToSupabase(formData.alvara, 'alvara');
      const registroCreaUrl = await uploadFileToSupabase(formData.registro_crea, 'registro_crea');
      const registroCalUrl = await uploadFileToSupabase(formData.registro_cal, 'registro_cal');

      const { data: enderecoData, error: enderecoError } = await supabase
        .from('endereco')
        .insert([
          {
            logradouro: formData.logradouro,
            numero: formData.numero ? parseInt(formData.numero, 10) : null,
            complemento: formData.complemento || null,
            bairro: formData.bairro || null,
            cidade: formData.cidade,
            uf: formData.uf.toUpperCase(),
            cep: formData.cep ? formatCepForDb(formData.cep) : null,
          },
        ])
        .select()
        .single();
      if (enderecoError) throw enderecoError;

      const { data: obraData, error: obraError } = await supabase
        .from('obra')
        .insert([
          {
            endereco_id: enderecoData.id,
            status: formData.status,
            data_inicio: formData.data_inicio,
            data_termino: formData.data_termino || null,
            responsavel_tecnico: formData.responsavel_tecnico,
            cnpj_empresa: cleanedCnpj,
          },
        ])
        .select()
        .single();
      if (obraError) throw obraError;

      const { error: docError } = await supabase
        .from('obras_documentos')
        .insert([
          {
            obra_id: obraData.id,
            alvara: alvaraUrl,
            registro_crea: registroCreaUrl,
            registro_cal: registroCalUrl,
          },
        ]);
      if (docError) throw docError;

      setSuccessMessage('Obra cadastrada com sucesso!');
      setFormData({
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        status: '',
        data_inicio: '',
        data_termino: '',
        responsavel_tecnico: '',
        alvara: null,
        registro_crea: null,
        registro_cal: null,
        cnpj_empresa: '',
        user_id: user?.id || '',
      });
      fetchObras();
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao cadastrar obra:', error);
      setErrorMessage(`Erro ao cadastrar obra: ${error.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.logradouro) return setErrorMessage('Por favor, insira o logradouro.');
    if (!formData.cidade) return setErrorMessage('Por favor, insira a cidade.');
    if (!formData.uf) return setErrorMessage('Por favor, insira a UF.');
    if (!validateUf(formData.uf)) return setErrorMessage('Por favor, insira uma UF válida (ex.: SP).');
    if (formData.cep && !validateCep(formData.cep)) return setErrorMessage('Por favor, insira um CEP válido (ex.: 12345-678).');
    if (formData.numero && !validateNumero(formData.numero)) return setErrorMessage('O número deve conter apenas dígitos.');
    if (!formData.status) return setErrorMessage('Por favor, selecione o status.');
    if (!formData.data_inicio) return setErrorMessage('Por favor, insira a data de início.');
    if (!formData.responsavel_tecnico) return setErrorMessage('Por favor, insira o responsável técnico.');
    if (!formData.cnpj_empresa) return setErrorMessage('Por favor, selecione uma construtora.');
    if (empresas.length === 0) return setErrorMessage('Nenhuma construtora disponível. Cadastre uma construtora primeiro.');

    const inicio = new Date(formData.data_inicio);
    const anoInicio = inicio.getFullYear();
    if (anoInicio < 1950 || anoInicio > 2050) {
      return setErrorMessage('A data de início deve estar entre 1950 e 2050.');
    }
    if (formData.data_termino) {
      const termino = new Date(formData.data_termino);
      const anoTermino = termino.getFullYear();
      if (anoTermino < 1950 || anoTermino > 2050) {
        return setErrorMessage('A data de término deve estar entre 1950 e 2050.');
      }
      if (termino < inicio) {
        return setErrorMessage('A data de término não pode ser anterior à data de início.');
      }
    }

    try {
      const cleanedCnpj = cleanCnpj(formData.cnpj_empresa);
      const { data: empresaExists, error: empresaError } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('cnpj', cleanedCnpj)
        .single();
      if (empresaError || !empresaExists) throw new Error('Construtora não encontrada.');

      const { data: obraData, error: obraError } = await supabase
        .from('obra')
        .select('endereco_id')
        .eq('id', editObraId)
        .single();
      if (obraError) throw obraError;

      const { error: enderecoError } = await supabase
        .from('endereco')
        .update({
          logradouro: formData.logradouro,
          numero: formData.numero ? parseInt(formData.numero, 10) : null,
          complemento: formData.complemento || null,
          bairro: formData.bairro || null,
          cidade: formData.cidade,
          uf: formData.uf.toUpperCase(),
          cep: formData.cep ? formatCepForDb(formData.cep) : null,
        })
        .eq('id', obraData.endereco_id);
      if (enderecoError) throw enderecoError;

      const { error: updateObraError } = await supabase
        .from('obra')
        .update({
          status: formData.status,
          data_inicio: formData.data_inicio,
          data_termino: formData.data_termino || null,
          responsavel_tecnico: formData.responsavel_tecnico,
          cnpj_empresa: cleanedCnpj,
        })
        .eq('id', editObraId);
      if (updateObraError) throw updateObraError;

      const alvaraUrl = formData.alvara instanceof File
        ? await uploadFileToSupabase(formData.alvara, 'alvara')
        : formData.alvara;
      const registroCreaUrl = formData.registro_crea instanceof File
        ? await uploadFileToSupabase(formData.registro_crea, 'registro_crea')
        : formData.registro_crea;
      const registroCalUrl = formData.registro_cal instanceof File
        ? await uploadFileToSupabase(formData.registro_cal, 'registro_cal')
        : formData.registro_cal;

      const { error: docError } = await supabase
        .from('obras_documentos')
        .update({
          alvara: alvaraUrl,
          registro_crea: registroCreaUrl,
          registro_cal: registroCalUrl,
        })
        .eq('obra_id', editObraId);
      if (docError) throw docError;

      setSuccessMessage('Obra atualizada com sucesso!');
      setFormData({
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        uf: '',
        cep: '',
        status: '',
        data_inicio: '',
        data_termino: '',
        responsavel_tecnico: '',
        alvara: null,
        registro_crea: null,
        registro_cal: null,
        cnpj_empresa: '',
        user_id: user?.id || '',
      });
      fetchObras();
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      setErrorMessage(`Erro ao atualizar obra: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { data: obraData, error: obraError } = await supabase
        .from('obra')
        .select('obras_documentos(alvara, registro_crea, registro_cal)')
        .eq('id', deleteObra.id)
        .single();
      if (obraError) throw obraError;

      const { alvara, registro_crea, registro_cal } = obraData.obras_documentos;
      const filesToDelete = [alvara, registro_crea, registro_cal]
        .filter(url => url)
        .map(url => url.split('/').slice(-2).join('/'));

      if (filesToDelete.length > 0) {
        await supabase.storage.from('documents').remove(filesToDelete);
      }

      const { error } = await supabase.from('obra').delete().eq('id', deleteObra.id);
      if (error) throw error;
      fetchObras();
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Erro ao remover obra:', error);
      setErrorMessage(`Erro ao remover obra: ${error.message}`);
    }
  };

  const editObra = async (id) => {
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
          ),
          obras_documentos (
            alvara,
            registro_crea,
            registro_cal
          )
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      setFormData({
        logradouro: data.endereco?.logradouro || '',
        numero: data.endereco?.numero?.toString() || '',
        complemento: data.endereco?.complemento || '',
        bairro: data.endereco?.bairro || '',
        cidade: data.endereco?.cidade || '',
        uf: data.endereco?.uf || '',
        cep: formatCepForDisplay(data.endereco?.cep || ''),
        status: data.status || '',
        data_inicio: data.data_inicio || '',
        data_termino: data.data_termino || '',
        responsavel_tecnico: data.responsavel_tecnico || '',
        alvara: data.obras_documentos?.alvara || null,
        registro_crea: data.obras_documentos?.registro_crea || null,
        registro_cal: data.obras_documentos?.registro_cal || null,
        cnpj_empresa: data.cnpj_empresa || '',
        user_id: data.user_id || user?.id || '',
      });
      setEditObraId(id);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar dados da obra para edição:', error);
      setErrorMessage(`Erro ao preparar edição: ${error.message}`);
    }
  };

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const filteredObras = obras.filter((obra) => {
    const endereco = `${obra.endereco?.logradouro || ''}, ${obra.endereco?.cidade || ''} - ${obra.endereco?.uf || ''}`;
    return (
      (!statusFilter || obra.status === statusFilter) &&
      endereco.toLowerCase().includes(filter.toLowerCase())
    );
  });

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
                <h2>Obras</h2>
                <div className="actions">
                  <input
                    type="text"
                    placeholder="Pesquisar por endereço"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">Todas</option>
                    <option value="ativa">Ativas</option>
                    <option value="inativa">Inativas</option>
                    <option value="concluida">Concluídas</option>
                  </select>
                  <button className="btn primary" onClick={() => setIsModalOpen(true)}>
                    <i className="ri-add-line"></i> Cadastrar Obra
                  </button>
                </div>
              </div>
              <table className="obra-table">
                <thead>
                  <tr>
                    <th>Obra</th>
                    <th>Empresa Associada</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredObras.length === 0 ? (
                    <tr>
                      <td colSpan="3">Nenhuma obra encontrada.</td>
                    </tr>
                  ) : (
                    filteredObras.map((obra) => (
                      <React.Fragment key={obra.id}>
                        <tr data-id={obra.id}>
                          <td>
                            {obra.endereco
                              ? `${obra.endereco.logradouro}, ${obra.endereco.cidade} - ${obra.endereco.uf}`
                              : 'Endereço não disponível'}
                          </td>
                          <td>{obra.empresa?.razao_social || 'Empresa não encontrada'}</td>
                          <td>
                            <button title="Editar" onClick={() => editObra(obra.id)}>
                              <i className="ri-edit-line"></i>
                            </button>
                            <button
                              title="Expandir"
                              className="expand-btn"
                              onClick={() => toggleExpandRow(obra.id)}
                            >
                              <i
                                className={
                                  expandedRow === obra.id
                                    ? 'ri-arrow-up-s-line'
                                    : 'ri-arrow-down-s-line'
                                }
                              ></i>
                            </button>
                            <button
                              title="Deletar"
                              onClick={() =>
                                setDeleteObra({
                                  id: obra.id,
                                  endereco: obra.endereco
                                    ? `${obra.endereco.logradouro}, ${obra.endereco.cidade} - ${obra.endereco.uf}`
                                    : 'Obra sem endereço',
                                })
                              }
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </td>
                        </tr>
                        {expandedRow === obra.id && (
                          <tr className="expanded-row" data-id={obra.id}>
                            <td colSpan="3">
                              <div className="expanded-details">
                                <p><strong>Status:</strong> {obra.status || 'N/A'}</p>
                                <p><strong>Data de Início:</strong> {obra.data_inicio || 'N/A'}</p>
                                <p><strong>Data de Término:</strong> {obra.data_termino || 'N/A'}</p>
                                <p><strong>Responsável Técnico:</strong> {obra.responsavel_tecnico || 'N/A'}</p>
                                <p>
                                  <strong>Alvará:</strong>{' '}
                                  {obra.obras_documentos?.alvara ? (
                                    <a href={obra.obras_documentos.alvara} target="_blank" rel="noopener noreferrer">
                                      Visualizar PDF
                                    </a>
                                  ) : (
                                    'N/A'
                                  )}
                                </p>
                                <p>
                                  <strong>Registro CREA:</strong>{' '}
                                  {obra.obras_documentos?.registro_crea ? (
                                    <a href={obra.obras_documentos.registro_crea} target="_blank" rel="noopener noreferrer">
                                      Visualizar PDF
                                    </a>
                                  ) : (
                                    'N/A'
                                  )}
                                </p>
                                <p>
                                  <strong>Registro CAL:</strong>{' '}
                                  {obra.obras_documentos?.registro_cal ? (
                                    <a href={obra.obras_documentos.registro_cal} target="_blank" rel="noopener noreferrer">
                                      Visualizar PDF
                                    </a>
                                  ) : (
                                    'N/A'
                                  )}
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
                  logradouro: '',
                  numero: '',
                  complemento: '',
                  bairro: '',
                  cidade: '',
                  uf: '',
                  cep: '',
                  status: '',
                  data_inicio: '',
                  data_termino: '',
                  responsavel_tecnico: '',
                  alvara: null,
                  registro_crea: null,
                  registro_cal: null,
                  cnpj_empresa: '',
                  user_id: user?.id || '',
                });
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-create-title">Cadastrar Obra</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="logradouro">Logradouro</label>
                  <input
                    type="text"
                    id="logradouro"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="numero">Número</label>
                  <input
                    type="text"
                    id="numero"
                    name="numero"
                    value={formData.numero}
                    onChange={handleNumeroChange}
                    placeholder="Ex.: 123"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="complemento">Complemento</label>
                  <input
                    type="text"
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bairro">Bairro</label>
                  <input
                    type="text"
                    id="bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cidade">Cidade</label>
                  <input
                    type="text"
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="uf">UF</label>
                  <input
                    type="text"
                    id="uf"
                    name="uf"
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    maxLength="2"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cep">CEP</label>
                  <input
                    type="text"
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCepChange}
                    placeholder="12345-678"
                    maxLength="9"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="data-inicio">Data de Início</label>
                  <input
                    type="date"
                    id="data-inicio"
                    name="data-inicio"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    min="1950-01-01"
                    max="2050-12-31"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="data-termino">Data de Término</label>
                  <input
                    type="date"
                    id="data-termino"
                    name="data-termino"
                    value={formData.data_termino}
                    onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
                    min="1950-01-01"
                    max="2050-12-31"
                  />
                </div>
              </div>
              <div className="form-row">
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
                <div className="form-group">
                  <label htmlFor="alvara">Alvará (PDF)</label>
                  <input
                    type="file"
                    id="alvara"
                    name="alvara"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, alvara: e.target.files[0] })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="registro-crea">Registro no CREA (PDF)</label>
                  <input
                    type="file"
                    id="registro-crea"
                    name="registro-crea"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_crea: e.target.files[0] })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="registro-cal">Registro no CAL (PDF)</label>
                  <input
                    type="file"
                    id="registro-cal"
                    name="registro-cal"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_cal: e.target.files[0] })}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="empresa">Empresa Associada</label>
                  <select
                    id="empresa"
                    name="empresa"
                    value={formData.cnpj_empresa}
                    onChange={(e) => setFormData({ ...formData, cnpj_empresa: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione uma empresa</option>
                    {empresas.length === 0 ? (
                      <option value="" disabled>Nenhuma empresa disponível</option>
                    ) : (
                      empresas.map((empresa) => (
                        <option key={empresa.cnpj} value={empresa.cnpj}>
                          {formatCnpjForDisplay(empresa.cnpj)} - {empresa.razao_social}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({
                      logradouro: '',
                      numero: '',
                      complemento: '',
                      bairro: '',
                      cidade: '',
                      uf: '',
                      cep: '',
                      status: '',
                      data_inicio: '',
                      data_termino: '',
                      responsavel_tecnico: '',
                      alvara: null,
                      registro_crea: null,
                      registro_cal: null,
                      cnpj_empresa: '',
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
                  logradouro: '',
                  numero: '',
                  complemento: '',
                  bairro: '',
                  cidade: '',
                  uf: '',
                  cep: '',
                  status: '',
                  data_inicio: '',
                  data_termino: '',
                  responsavel_tecnico: '',
                  alvara: null,
                  registro_crea: null,
                  registro_cal: null,
                  cnpj_empresa: '',
                  user_id: user?.id || '',
                });
                setErrorMessage('');
                setSuccessMessage('');
              }}
            >
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-edit-title">Editar Obra</h2>
            <form onSubmit={handleEditSubmit}>
              <input type="hidden" id="edit-obra-id" name="obra-id" value={editObraId} />
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-logradouro">Logradouro</label>
                  <input
                    type="text"
                    id="edit-logradouro"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-numero">Número</label>
                  <input
                    type="text"
                    id="edit-numero"
                    name="numero"
                    value={formData.numero}
                    onChange={handleNumeroChange}
                    placeholder="Ex.: 123"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-complemento">Complemento</label>
                  <input
                    type="text"
                    id="edit-complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-bairro">Bairro</label>
                  <input
                    type="text"
                    id="edit-bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-cidade">Cidade</label>
                  <input
                    type="text"
                    id="edit-cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-uf">UF</label>
                  <input
                    type="text"
                    id="edit-uf"
                    name="uf"
                    value={formData.uf}
                    onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                    maxLength="2"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-cep">CEP</label>
                  <input
                    type="text"
                    id="edit-cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleCepChange}
                    placeholder="12345-678"
                    maxLength="9"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status"
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione</option>
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-data-inicio">Data de Início</label>
                  <input
                    type="date"
                    id="edit-data-inicio"
                    name="data-inicio"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    min="1950-01-01"
                    max="2050-12-31"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-data-termino">Data de Término</label>
                  <input
                    type="date"
                    id="edit-data-termino"
                    name="data-termino"
                    value={formData.data_termino}
                    onChange={(e) => setFormData({ ...formData, data_termino: e.target.value })}
                    min="1950-01-01"
                    max="2050-12-31"
                  />
                </div>
              </div>
              <div className="form-row">
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
                <div className="form-group">
                  <label htmlFor="edit-alvara">Alvará (PDF)</label>
                  <input
                    type="file"
                    id="edit-alvara"
                    name="alvara"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, alvara: e.target.files[0] })}
                  />
                  {formData.alvara && typeof formData.alvara === 'string' && (
                    <p>
                      Arquivo atual:{' '}
                      <a href={formData.alvara} target="_blank" rel="noopener noreferrer">
                        Visualizar PDF
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-registro-crea">Registro no CREA (PDF)</label>
                  <input
                    type="file"
                    id="edit-registro-crea"
                    name="registro-crea"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_crea: e.target.files[0] })}
                  />
                  {formData.registro_crea && typeof formData.registro_crea === 'string' && (
                    <p>
                      Arquivo atual:{' '}
                      <a href={formData.registro_crea} target="_blank" rel="noopener noreferrer">
                        Visualizar PDF
                      </a>
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="edit-registro-cal">Registro no CAL (PDF)</label>
                  <input
                    type="file"
                    id="edit-registro-cal"
                    name="registro-cal"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_cal: e.target.files[0] })}
                  />
                  {formData.registro_cal && typeof formData.registro_cal === 'string' && (
                    <p>
                      Arquivo atual:{' '}
                      <a href={formData.registro_cal} target="_blank" rel="noopener noreferrer">
                        Visualizar PDF
                      </a>
                    </p>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-empresa">Empresa Associada</label>
                  <select
                    id="edit-empresa"
                    name="empresa"
                    value={formData.cnpj_empresa}
                    onChange={(e) => setFormData({ ...formData, cnpj_empresa: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione uma empresa</option>
                    {empresas.length === 0 ? (
                      <option value="" disabled>Nenhuma empresa disponível</option>
                    ) : (
                      empresas.map((empresa) => (
                        <option key={empresa.cnpj} value={empresa.cnpj}>
                          {formatCnpjForDisplay(empresa.cnpj)} - {empresa.razao_social}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setFormData({
                      logradouro: '',
                      numero: '',
                      complemento: '',
                      bairro: '',
                      cidade: '',
                      uf: '',
                      cep: '',
                      status: '',
                      data_inicio: '',
                      data_termino: '',
                      responsavel_tecnico: '',
                      alvara: null,
                      registro_crea: null,
                      registro_cal: null,
                      cnpj_empresa: '',
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
              Tem certeza que deseja remover a obra "<span>{deleteObra.endereco}</span>"?
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

export default Obra;