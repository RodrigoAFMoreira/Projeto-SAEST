// uado em epi.jsx
// Este componente exibe um modal com um formulário para adicionar ou editar EPIs.

import React from 'react';

const ModalFormularioEpi = ({
  estaAberto,
  fecharModal,
  dadosFormulario,
  alterarFormulario,
  enviarFormulario,
  tiposEpi,
  locaisUso,
  obras,
  erro,
  sucesso,
  ehEdicao,
}) => {
  if (!estaAberto) return null;
  const hoje = new Date().toISOString().split('T')[0];

  return (
    <div className="modal-overlay" id={ehEdicao ? 'modalEditarEpi' : 'modalEpi'}>
      <div className="modal">
        <button className="modal-close" onClick={fecharModal}>×</button>
        <h2>{ehEdicao ? 'Editar EPI' : 'Adicionar EPI'}</h2>
        <div className="modal-content-scroll">
          <form id={ehEdicao ? 'edit-epi-form' : 'epi-form'} onSubmit={(e) => enviarFormulario(e, ehEdicao)}>
            {ehEdicao && <input type="hidden" id="edit-epi-id" value={dadosFormulario.id} />}
            <div className="form-group">
              <label htmlFor="nome">Nome/Código de EPI</label>
              <input
                type="text"
                id="nome"
                className="input-standard"
                value={dadosFormulario.nome || ''}
                onChange={alterarFormulario}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="tipo">Tipo de EPI</label>
              <select
                id="tipo"
                className="input-standard"
                value={dadosFormulario.tipo || ''}
                onChange={alterarFormulario}
                required
              >
                <option value="" disabled>Selecione</option>
                {tiposEpi.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="condicao">Condição</label>
              <select
                id="condicao"
                className="input-standard"
                value={dadosFormulario.condicao || ''}
                onChange={alterarFormulario}
                required
              >
                <option value="" disabled>Selecione</option>
                <option value="Novo">Novo</option>
                <option value="Usado">Usado</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="local_uso">Local de Uso</label>
              <select
                id="local_uso"
                className="input-standard"
                value={dadosFormulario.local_uso || ''}
                onChange={alterarFormulario}
                required
              >
                <option value="" disabled>Selecione</option>
                {locaisUso.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="disponibilidade">Disponibilidade</label>
              <select
                id="disponibilidade"
                className="input-standard"
                value={dadosFormulario.disponibilidade || ''}
                onChange={alterarFormulario}
                required
              >
                <option value="" disabled>Selecione</option>
                <option value="Em Estoque">Em Estoque</option>
                <option value="Em Uso">Em Uso</option>
                <option value="Indisponível">Indisponível</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="data_aquisicao">Data de Aquisição</label>
              <input
                type="date"
                id="data_aquisicao"
                className="input-standard"
                value={dadosFormulario.data_aquisicao || ''}
                onChange={alterarFormulario}
                max={hoje}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="validade">Validade</label>
              <input
                type="date"
                id="validade"
                className="input-standard"
                value={dadosFormulario.validade || ''}
                onChange={alterarFormulario}
                min={hoje}
              />
            </div>
            <div className="form-group">
              <label htmlFor="ano_fabricacao">Ano de Fabricação</label>
              <input
                type="number"
                id="ano_fabricacao"
                className="input-standard"
                value={dadosFormulario.ano_fabricacao || ''}
                onChange={alterarFormulario}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                className="input-standard"
                rows="4"
                value={dadosFormulario.descricao || ''}
                onChange={alterarFormulario}
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade</label>
              <input
                type="number"
                id="quantidade"
                className="input-standard"
                value={dadosFormulario.quantidade || ''}
                onChange={alterarFormulario}
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="obra_id">Obra Associada</label>
              <select
                id="obra_id"
                className="input-standard"
                value={dadosFormulario.obra_id || ''}
                onChange={alterarFormulario}
                //required//
              >
                <option value="" disabled>Selecione</option>
                {obras.map((obra) => (
                  <option key={obra.value} value={obra.value}>
                    {obra.label}
                  </option>
                ))}
              </select>
            </div>
            <div id="error-message" style={{ color: 'red' }}>{erro}</div>
            <div id="success-message" style={{ color: 'green' }}>{sucesso}</div>
            <div className="form-actions">
              <button type="button" className="btn secondary" onClick={fecharModal}>
                Cancelar
              </button>
              <button type="submit" className="btn primary">
                {ehEdicao ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalFormularioEpi;