// Usado em epi.jsx
// Este componente exibe um modal para gerenciar tipos de EPIs e locais de uso, permitindo adicionar ou remover opções.

import React from 'react';

const ModalGerenciarOpcoes = ({
  estaAberto,
  fecharModal,
  tiposEpi,
  locaisUso,
  formularioGerenciar,
  alterarFormularioGerenciar,
  adicionarTipo,
  adicionarLocal,
  removerTipo,
  removerLocal,
  erro,
  sucesso,
}) => {
  if (!estaAberto) return null;

  return (
    <div className="modal-overlay" id="modalGerenciarEpi">
      <div className="modal">
        <button className="modal-close" onClick={fecharModal}>×</button>
        <h2>Gerenciar EPI</h2>
        <div className="modal-content-scroll">
          <div className="form-group">
            <label htmlFor="novo-tipo-epi">Adicionar Tipo de EPI</label>
            <div className="input-button-group">
              <input
                type="text"
                id="novo-tipo-epi"
                className="input-standard"
                value={formularioGerenciar.novoTipo}
                onChange={alterarFormularioGerenciar}
                placeholder="Digite o novo tipo de EPI"
              />
              <button type="button" className="btn primary" onClick={adicionarTipo}>
                Adicionar
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Tipos de EPI Existentes</label>
            <ul className="option-list">
              {tiposEpi.map((tipo, index) => (
                <li key={tipo.value}>
                  {tipo.label}
                  {index >= 5 && (
                    <button
                      className="btn secondary"
                      onClick={() => removerTipo(index)}
                    >
                      <i className="ri-delete-bin-line"></i> Excluir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="form-group">
            <label htmlFor="novo-local-uso">Adicionar Local de Uso</label>
            <div className="input-button-group">
              <input
                type="text"
                id="novo-local-uso"
                className="input-standard"
                value={formularioGerenciar.novoLocal}
                onChange={alterarFormularioGerenciar}
                placeholder="Digite o novo local de uso"
              />
              <button type="button" className="btn primary" onClick={adicionarLocal}>
                Adicionar
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Locais de Uso Existentes</label>
            <ul className="option-list">
              {locaisUso.map((local, index) => (
                <li key={local.value}>
                  {local.label}
                  {index >= 4 && (
                    <button
                      className="btn secondary"
                      onClick={() => removerLocal(index)}
                    >
                      <i className="ri-delete-bin-line"></i> Excluir
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div id="gerenciar-error-message" style={{ color: 'red' }}>{erro}</div>
          <div id="gerenciar-success-message" style={{ color: 'green' }}>{sucesso}</div>
          <div className="form-actions">
            <button type="button" className="btn secondary" onClick={fecharModal}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalGerenciarOpcoes;