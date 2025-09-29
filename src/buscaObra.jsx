// Elemento de busca de obras por CNPJ ou logradouro

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import Sidebar from './componentes/sidebar';
import LoadingSpinner from './componentes/carregando';
import './css/empresaObra.css';


const BuscaObras = ({ isSidebarMinimized, userData }) => {
  const [cnpj, setCnpj] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [obras, setObras] = useState([]);
  const [obraSelecionada, setObraSelecionada] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSidebarMinimizedState, setIsSidebarMinimizedState] = useState(isSidebarMinimized);
  const navigate = useNavigate();
  const cleanCnpj = (cnpj) => cnpj.replace(/[\.\-\/]/g, '');
  const validateCNPJ = (cnpj) => {
    const cleanedCnpj = cleanCnpj(cnpj);
    const cnpjRegex = /^\d{14}$/;
    return cnpjRegex.test(cleanedCnpj);
  };

  const fetchEnderecoById = async (enderecoId) => {
    if (!enderecoId) return null;
    const { data, error } = await supabase
      .from('endereco')
      .select('logradouro, numero, complemento, bairro, cidade, uf, cep')
      .eq('id', enderecoId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error; 
    return data || null;
  };

  //buscar obras por CNPJ
  const handleCnpjSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setObras([]);
    setObraSelecionada(null);
    setLoading(true);

    if (!cnpj) {
      setErrorMessage('Por favor, insira o CNPJ.');
      setLoading(false);
      return;
    }
    if (!validateCNPJ(cnpj)) {
      setErrorMessage('Por favor, insira um CNPJ válido (ex.: 12.345.678/0001-90).');
      setLoading(false);
      return;
    }

    try {
      const cleanedCnpj = cleanCnpj(cnpj);
      //verificarse a empresa existe
      const { data: empresa, error: empresaError } = await supabase
        .from('empresa')
        .select('cnpj')
        .eq('cnpj', cleanedCnpj)
        .maybeSingle();

      if (empresaError && empresaError.code !== 'PGRST116') throw empresaError;
      if (!empresa) {
        setErrorMessage('Empresa não encontrada para o CNPJ informado.');
        setLoading(false);
        return;
      }

      // buscar obras associadas ao cnpj
      let { data: obrasData, error: obrasError } = await supabase
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
        `)
        .eq('cnpj_empresa', cleanedCnpj);

      if (obrasError) {
        console.warn('Erro no join com endereco, buscando separadamente:', obrasError);
        const { data: obrasSemJoin, error: fallbackError } = await supabase
          .from('obra')
          .select('*')
          .eq('cnpj_empresa', cleanedCnpj);
        if (fallbackError) throw fallbackError;

        obrasData = await Promise.all(
          obrasSemJoin.map(async (obra) => {
            const endereco = await fetchEnderecoById(obra.endereco_id);
            return { ...obra, endereco };
          })
        );
      }

      setObras(obrasData || []);
      if (obrasData.length === 0) {
        setErrorMessage('Nenhuma obra encontrada para esta empresa.');
      }
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
      setErrorMessage(`Erro ao buscar obras: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogradouroSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setObraSelecionada(null);
    setLoading(true);

    if (!logradouro) {
      setErrorMessage('Por favor, insira o logradouro da obra.');
      setLoading(false);
      return;
    }

    try {
      let { data: obraData, error: obraError } = await supabase
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
        `)
        .ilike('endereco.logradouro', `%${logradouro}%`)
        .maybeSingle();

      if (obraError) {
        console.warn('Erro no join com endereco, buscando separadamente:', obraError);
        const { data: enderecos, error: enderecoError } = await supabase
          .from('endereco')
          .select('id, logradouro, numero, complemento, bairro, cidade, uf, cep')
          .ilike('logradouro', `%${logradouro}%`);
        if (enderecoError) throw enderecoError;

        if (!enderecos || enderecos.length === 0) {
          setErrorMessage('Nenhuma obra encontrada para o logradouro informado.');
          setLoading(false);
          return;
        }

        const { data: obraSemJoin, error: fallbackError } = await supabase
          .from('obra')
          .select('*')
          .eq('endereco_id', enderecos[0].id) 
          .maybeSingle();
        if (fallbackError) throw fallbackError;

        if (!obraSemJoin) {
          setErrorMessage('Nenhuma obra encontrada para o logradouro informado.');
          setLoading(false);
          return;
        }

        obraData = { ...obraSemJoin, endereco: enderecos[0] };
      }

      if (!obraData) {
        setErrorMessage('Nenhuma obra encontrada para o logradouro informado.');
        setLoading(false);
        return;
      }

      setObraSelecionada(obraData);
    } catch (error) {
      console.error('Erro ao buscar obra por logradouro:', error);
      setErrorMessage(`Erro ao buscar obra: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatarEndereco = (endereco) => {
    if (!endereco) return 'Endereço não disponível';
    const { logradouro, numero, complemento, bairro, cidade, uf, cep } = endereco;
    return `${logradouro || ''}${numero ? ', ' + numero : ''}${complemento ? ', ' + complemento : ''}, ${bairro || ''}, ${cidade || ''} - ${uf || ''}${cep ? `, ${cep}` : ''}`.trim();
  };

  return (
    <div className="container">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="dashboard-wrapper">
          <div className={`sidebar-wrapper ${isSidebarMinimizedState ? 'minimized' : ''}`}>
            <Sidebar
              userType={userData.tipo}
              userEmail={userData.email}
              isMinimized={isSidebarMinimizedState}
              onToggle={() => setIsSidebarMinimizedState(!isSidebarMinimizedState)}
            />
          </div>
          <main className="main-content">
            <header className="main-header">
              <i className="ri-notification-3-line"></i>
            </header>
            <section className="content-box">
              <div className="content-header">
                <h2>Busca de Obras</h2>
              </div>
              {errorMessage && <div className="error-message">{errorMessage}</div>}

              {/*Importante!!! formulário para buscar obras por cnpj */}
              <form onSubmit={handleCnpjSubmit} className="form-row">
                <div className="form-group">
                  <label htmlFor="cnpj">CNPJ da Empresa</label>
                  <input
                    type="text"
                    id="cnpj"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="Ex.: 12.345.678/0001-90"
                    required
                  />
                </div>
                <div className="form-group">
                  <button type="submit" className="btn primary">Buscar Obras</button>
                </div>
              </form>

              {/* Tabela */}
              {obras.length > 0 && (
                <table className="obra-table">
                  <thead>
                    <tr>
                      <th>Endereço</th>
                      <th>Responsável Técnico</th>
                      <th>Status</th>
                      <th>Alvará</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obras.map((obra) => (
                      <tr key={obra.id}>
                        <td>{formatarEndereco(obra.endereco)}</td>
                        <td>{obra.responsavel_tecnico || 'N/A'}</td>
                        <td>{obra.status || 'Ativo'}</td>
                        <td>{obra.alvara || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* formulário para buscar obra p/ logradouro */}
              <form onSubmit={handleLogradouroSubmit} className="form-row" style={{ marginTop: '20px' }}>
                <div className="form-group">
                  <label htmlFor="logradouro">Logradouro da Obra</label>
                  <input
                    type="text"
                    id="logradouro"
                    value={logradouro}
                    onChange={(e) => setLogradouro(e.target.value)}
                    placeholder="Ex.: Rua das Flores"
                    required
                  />
                </div>
                <div className="form-group">
                  <button type="submit" className="btn primary">Buscar Obra</button>
                </div>
              </form>

              {obraSelecionada && (
                <div className="expanded-details" style={{ marginTop: '20px' }}>
                  <h3>Detalhes da Obra</h3>
                  <p><strong>Endereço:</strong> {formatarEndereco(obraSelecionada.endereco)}</p>
                  <p><strong>Responsável Técnico:</strong> {obraSelecionada.responsavel_tecnico || 'N/A'}</p>
                  <p><strong>Status:</strong> {obraSelecionada.status || 'Ativo'}</p>
                  <p><strong>Alvará:</strong> {obraSelecionada.alvara || 'N/A'}</p>
                  <p><strong>CNPJ da Empresa:</strong> {obraSelecionada.cnpj_empresa || 'N/A'}</p>
                </div>
              )}
            </section>
          </main>
        </div>
      )}
    </div>
  );
};

export default BuscaObras;