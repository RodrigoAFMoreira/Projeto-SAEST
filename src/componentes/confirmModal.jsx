// usado em epi.jsx
// Este componente exibe um modal de confirmação para ações críticas, como exclusão de itens.
import React from 'react';


const ModalConfirmacao = ({ estaAberto, fecharModal, confirmar, titulo, mensagem }) => {
  if (!estaAberto) return null;

  return (
    <div className="modal-overlay" id="modalConfirmarExclusao">
      <div className="modal confirmation">
        <h3>{titulo}</h3>
        <p>{mensagem}</p>
        <div className="form-actions">
          <button type="button" className="btn secondary" onClick={fecharModal}>
            Cancelar
          </button>
          <button type="button" className="btn primary" onClick={confirmar}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;