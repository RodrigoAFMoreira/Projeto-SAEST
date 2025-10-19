// Elemento de gerenciamento de obras, incluindo criação, edição, remoção e listagem com filtros e detalhes expandidos

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../src/config/supabaseClient';
import Sidebar from './componentes/sidebar';
import LoadingSpinner from './componentes/carregando';
import './css/menuEsquerdo.css';
import './css/obra.css';

const Obra = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const [obras, setObras] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          setErrorMessage('Usuário não está logado.');
          navigate('/login');
          return;
        }
        setUser(user);

        const { data, error: userError } = await supabase
          .from('usuarios')
          .select('id, nome, email, tipo, telefone')
          .eq('id', user.id)
          .single();
        if (userError || !data) {
          setUserData({ tipo: 'user', nome: '', email: user.email, telefone: '' });
        } else {
          setUserData(data);
        }

        if (data?.tipo !== 'user') {
          await Promise.all([fetchEmpresas(user.id), fetchObras(user.id)]);
        } else {
          setErrorMessage('Acesso não autorizado.');
          navigate('/menu');
        }
      } catch {
        setErrorMessage('Erro ao carregar dados do usuário.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const fetchEmpresas = async (userId) => {
    const { data, error } = await supabase
      .from('empresa')
      .select('cnpj, razao_social')
      .eq('user_id', userId);
    if (error) setErrorMessage('Erro ao carregar empresas.');
    setEmpresas(data || []);
  };

  const fetchObras = async (userId) => {
    try {
      const { data: empresasData, error: empresasError } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('user_id', userId);
      if (empresasError) throw empresasError;

      const cnpjs = empresasData.map(empresa => empresa.cnpj);

      const { data, error } = await supabase
        .from('obra')
        .select(`
          *,
          endereco (logradouro, numero, complemento, bairro, cidade, uf, cep),
          empresa (razao_social),
          obras_documentos (alvara, registro_crea, registro_cal)
        `)
        .in('cnpj_empresa', cnpjs);
      if (error) throw error;
      setObras(data || []);
    } catch (error) {
      setErrorMessage(`Erro ao carregar obras: ${error.message}`);
    }
  };

  const validateForm = () => {
    if (!formData.logradouro) return 'Logradouro é obrigatório.';
    if (!formData.cidade) return 'Cidade é obrigatória.';
    if (!formData.uf || !/^[A-Z]{2}$/.test(formData.uf)) return 'UF inválida (ex.: SP).';
    if (formData.cep && !/^\d{5}-\d{3}$/.test(formData.cep)) return 'CEP inválido (ex.: 12345-678).';
    if (formData.numero && !/^\d*$/.test(formData.numero)) return 'Número deve conter apenas dígitos.';
    if (!formData.status) return 'Status é obrigatório.';
    if (!formData.data_inicio) return 'Data de início é obrigatória.';
    if (!formData.responsavel_tecnico) return 'Responsável técnico é obrigatório.';
    if (!isEditMode && !formData.alvara) return 'Alvará é obrigatório.';
    if (!isEditMode && !formData.registro_crea) return 'Registro CREA é obrigatório.';
    if (!isEditMode && !formData.registro_cal) return 'Registro CAL é obrigatório.';
    if (!formData.cnpj_empresa) return 'Construtora é obrigatória.';
    if (empresas.length === 0) return 'Nenhuma construtora disponível.';

    const inicio = new Date(formData.data_inicio);
    if (inicio.getFullYear() < 1950 || inicio.getFullYear() > 2050) {
      return 'Data de início deve estar entre 1950 e 2050.';
    }
    if (formData.data_termino) {
      const termino = new Date(formData.data_termino);
      if (termino.getFullYear() < 1950 || termino.getFullYear() > 2050) {
        return 'Data de término deve estar entre 1950 e 2050.';
      }
      if (termino < inicio) {
        return 'Data de término não pode ser anterior à data de início.';
      }
    }
    return null;
  };

  const formatCepForDb = (cep) => cep.replace(/\D/g, '');
  const formatCepForDisplay = (cep) => {
    if (!cep) return '';
    const cleanCep = cep.replace(/\D/g, '');
    return cleanCep.length === 8 ? `${cleanCep.slice(0, 5)}-${cleanCep.slice(5)}` : cep;
  };
  const cleanCnpj = (cnpj) => cnpj.replace(/[\.\-\/]/g, '');
  const formatCnpjForDisplay = (cnpj) => {
    if (!cnpj || cnpj.length !== 14) return cnpj;
    return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12)}`;
  };

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) value = `${value.slice(0, 5)}-${value.slice(5, 8)}`;
    setFormData({ ...formData, cep: value });
  };

  const handleNumeroChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*$/.test(value)) {
      setFormData({ ...formData, numero: value });
    }
  };

  const uploadFileToSupabase = async (file, fileName) => {
    if (!file) return null;
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`obras/${fileName}_${Date.now()}.pdf`, file, { contentType: 'application/pdf' });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) return setErrorMessage(validationError);

    try {
      const cleanedCnpj = cleanCnpj(formData.cnpj_empresa);
      const { data: empresaExists } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('cnpj', cleanedCnpj)
        .eq('user_id', user.id)
        .single();
      if (!empresaExists) throw new Error('Construtora não encontrada ou não pertence ao usuário.');

      const alvaraUrl = formData.alvara instanceof File
        ? await uploadFileToSupabase(formData.alvara, 'alvara')
        : formData.alvara;
      const registroCreaUrl = formData.registro_crea instanceof File
        ? await uploadFileToSupabase(formData.registro_crea, 'registro_crea')
        : formData.registro_crea;
      const registroCalUrl = formData.registro_cal instanceof File
        ? await uploadFileToSupabase(formData.registro_cal, 'registro_cal')
        : formData.registro_cal;

      let enderecoId;
      if (isEditMode) {
        const { data: obraData } = await supabase.from('obra').select('endereco_id').eq('id', editObraId).single();
        enderecoId = obraData.endereco_id;
        await supabase
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
          .eq('id', enderecoId);
      } else {
        const { data: enderecoData } = await supabase
          .from('endereco')
          .insert({
            logradouro: formData.logradouro,
            numero: formData.numero ? parseInt(formData.numero, 10) : null,
            complemento: formData.complemento || null,
            bairro: formData.bairro || null,
            cidade: formData.cidade,
            uf: formData.uf.toUpperCase(),
            cep: formData.cep ? formatCepForDb(formData.cep) : null,
          })
          .select()
          .single();
        enderecoId = enderecoData.id;
      }

      const obraPayload = {
        endereco_id: enderecoId,
        status: formData.status,
        data_inicio: formData.data_inicio,
        data_termino: formData.data_termino || null,
        responsavel_tecnico: formData.responsavel_tecnico,
        cnpj_empresa: cleanedCnpj,
      };

      let obraId;
      if (isEditMode) {
        await supabase.from('obra').update(obraPayload).eq('id', editObraId);
        obraId = editObraId;
      } else {
        const { data: obraData } = await supabase.from('obra').insert(obraPayload).select().single();
        obraId = obraData.id;
      }

      if (alvaraUrl || registroCreaUrl || registroCalUrl) {
        const docPayload = { obra_id: obraId, alvara: alvaraUrl, registro_crea: registroCreaUrl, registro_cal: registroCalUrl };
        if (isEditMode) {
          await supabase.from('obras_documentos').update(docPayload).eq('obra_id', obraId);
        } else {
          await supabase.from('obras_documentos').insert(docPayload);
        }
      }

      setSuccessMessage(`Obra ${isEditMode ? 'atualizada' : 'cadastrada'} com sucesso!`);
      resetForm();
      fetchObras(user.id);
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMessage('');
      }, 1500);
    } catch (error) {
      setErrorMessage(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} obra: ${error.message}`);
    }
  };

  const handleDelete = async () => {
    try {
      const { data: obraData, error: fetchError } = await supabase
        .from('obra')
        .select('obras_documentos(alvara, registro_crea, registro_cal), cnpj_empresa')
        .eq('id', deleteObra.id)
        .single();
      if (fetchError) throw new Error('Erro ao buscar documentos da obra.');

      const { data: empresaData, error: empresaError } = await supabase
        .from('empresa')
        .select('user_id')
        .eq('cnpj', obraData.cnpj_empresa)
        .single();
      if (empresaError || empresaData.user_id !== user.id) {
        throw new Error('Obra não pertence ao usuário.');
      }

      const filesToDelete = [
        obraData.obras_documentos?.alvara,
        obraData.obras_documentos?.registro_crea,
        obraData.obras_documentos?.registro_cal,
      ]
        .filter(url => url)
        .map(url => url.split('/').slice(-2).join('/'));
      if (filesToDelete.length > 0) {
        const { error: storageError } = await supabase.storage.from('documents').remove(filesToDelete);
        if (storageError) throw new Error('Erro ao remover documentos.');
      }

      const { error: deleteError } = await supabase.from('obra').delete().eq('id', deleteObra.id);
      if (deleteError) throw new Error('Erro ao excluir obra.');

      await fetchObras(user.id);
      setIsDeleteModalOpen(false);
      setSuccessMessage('Obra removida com sucesso!');
      setTimeout(() => setSuccessMessage(''), 1500);
    } catch (error) {
      setErrorMessage(`Erro ao remover obra: ${error.message}`);
    }
  };

  const editObra = async (id) => {
    const { data } = await supabase
      .from('obra')
      .select(`
        *,
        endereco (logradouro, numero, complemento, bairro, cidade, uf, cep),
        obras_documentos (alvara, registro_crea, registro_cal),
        empresa (user_id)
      `)
      .eq('id', id)
      .single();

    if (data.empresa.user_id !== user.id) {
      setErrorMessage('Acesso não autorizado para editar esta obra.');
      return;
    }

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
    });
    setEditObraId(id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
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
    });
    setIsEditMode(false);
    setEditObraId(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const toggleExpandRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const filteredObras = obras.filter((obra) => {
    const endereco = `${obra.endereco?.logradouro || ''}, ${obra.endereco?.cidade || ''} - ${obra.endereco?.uf || ''}`;
    return (!statusFilter || obra.status === statusFilter) && endereco.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="container">
      {loading ? (
        <LoadingSpinner />
      ) : errorMessage && !user ? (
        <div className="error-container">
          <p>{errorMessage}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      ) : user ? (
        <div className="dashboard-wrapper">
          <div className={`sidebar-wrapper ${isSidebarMinimized ? 'minimized' : ''}`}>
            <Sidebar
              userType={userData.tipo}
              userEmail={userData.email}
              isMinimized={isSidebarMinimized}
              onToggle={() => setIsSidebarMinimized(!isSidebarMinimized)}
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
                        <tr>
                          <td>
                            {obra.endereco
                              ? `${obra.endereco.logradouro}, ${obra.endereco.cidade} - ${obra.endereco.uf}`
                              : 'Endereço não disponível'}
                          </td>
                          <td>{obra.empresa?.razao_social || 'Empresa não encontrada'}</td>
                          <td className="action-buttons">
                            <button className="edit-btn" title="Editar" onClick={() => editObra(obra.id)}>
                              <i className="ri-edit-line"></i> Editar
                            </button>
                            <button className="expand-btn" title="Expandir" onClick={() => toggleExpandRow(obra.id)}>
                              <i className={expandedRow === obra.id ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}></i>
                              {expandedRow === obra.id ? 'Recolher' : 'Expandir'}
                            </button>
                            <button
                              className="delete-btn"
                              title="Deletar"
                              onClick={() => {
                                setDeleteObra({
                                  id: obra.id,
                                  endereco: obra.endereco
                                    ? `${obra.endereco.logradouro}, ${obra.endereco.cidade} - ${obra.endereco.uf}`
                                    : 'Obra sem endereço',
                                });
                                setIsDeleteModalOpen(true);
                              }}
                            >
                              <i className="ri-delete-bin-line"></i> Deletar
                            </button>
                          </td>
                        </tr>
                        {expandedRow === obra.id && (
                          <tr className="expanded-row">
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
        <div className="modal-overlay" role="dialog" aria-labelledby="modal-title">
          <div className="modal">
            <button className="modal-close" aria-label="Fechar modal" onClick={() => setIsModalOpen(false)}>
              <i className="ri-close-line"></i>
            </button>
            <h2 id="modal-title">{isEditMode ? 'Editar Obra' : 'Cadastrar Obra'}</h2>
            <i className="ri-settings-3-line modal-icon"></i>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="logradouro">Logradouro</label>
                  <input
                    type="text"
                    id="logradouro"
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
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bairro">Bairro</label>
                  <input
                    type="text"
                    id="bairro"
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
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, alvara: e.target.files[0] })}
                    required={!isEditMode}
                  />
                  {isEditMode && formData.alvara && typeof formData.alvara === 'string' && (
                    <p>
                      Arquivo atual: <a href={formData.alvara} target="_blank" rel="noopener noreferrer">Visualizar PDF</a>
                    </p>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="registro-crea">Registro no CREA (PDF)</label>
                  <input
                    type="file"
                    id="registro-crea"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_crea: e.target.files[0] })}
                    required={!isEditMode}
                  />
                  {isEditMode && formData.registro_crea && typeof formData.registro_crea === 'string' && (
                    <p>
                      Arquivo atual: <a href={formData.registro_crea} target="_blank" rel="noopener noreferrer">Visualizar PDF</a>
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="registro-cal">Registro no CAL (PDF)</label>
                  <input
                    type="file"
                    id="registro-cal"
                    accept="application/pdf"
                    onChange={(e) => setFormData({ ...formData, registro_cal: e.target.files[0] })}
                    required={!isEditMode}
                  />
                  {isEditMode && formData.registro_cal && typeof formData.registro_cal === 'string' && (
                    <p>
                      Arquivo atual: <a href={formData.registro_cal} target="_blank" rel="noopener noreferrer">Visualizar PDF</a>
                    </p>
                  )}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="empresa">Empresa Associada</label>
                  <select
                    id="empresa"
                    value={formData.cnpj_empresa}
                    onChange={(e) => setFormData({ ...formData, cnpj_empresa: e.target.value })}
                    required
                  >
                    <option value="" disabled>Selecione uma empresa</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.cnpj} value={empresa.cnpj}>
                        {formatCnpjForDisplay(empresa.cnpj)} - {empresa.razao_social}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-buttons">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-btn">{isEditMode ? 'Salvar' : 'Cadastrar'}</button>
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
            <p>Tem certeza que deseja remover a obra "{deleteObra.endereco}"?</p>
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

export default Obra;