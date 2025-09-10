// usado em epi.jsx
// Este componente exibe uma tabela de EPIs com funcionalidades de expansão de linha e ações de edição/exclusão.
import React from 'react';


const TabelaEpi = ({ epis, obras, linhasExpandidas, alternarExpansao, editarEpi, excluirEpi }) => {
  return (
    <div className="company-table">
      <table>
        <thead>
          <tr>
            <th>Tipo de EPI</th>
            <th>Obra Associada</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {epis.length === 0 ? (
            <tr>
              <td colSpan="3">Nenhum EPI encontrado.</td>
            </tr>
          ) : (
            epis.map((epi) => (
              <React.Fragment key={epi.id}>
                <tr data-id={epi.id}>
                  <td>{epi.tipo || 'N/A'}</td>
                  <td>
                    {obras.find((obra) => obra.value === epi.obra_id)?.label || 'Não especificada'}
                  </td>
                  <td>
                    <button
                      className="btn primary"
                      onClick={() => editarEpi(epi)}
                      title="Editar"
                    >
                      <i className="ri-edit-line"></i> Editar
                    </button>
                    <button
                      className="expand-btn"
                      onClick={() => alternarExpansao(epi.id)}
                      title="Expandir"
                    >
                      <i className={`ri ${linhasExpandidas.includes(epi.id) ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`}></i>
                    </button>
                    <button
                      className="btn secondary"
                      onClick={() => excluirEpi(epi.id)}
                      title="Excluir"
                    >
                      <i className="ri-delete-bin-line"></i> Excluir
                    </button>
                  </td>
                </tr>
                {linhasExpandidas.includes(epi.id) && (
                  <tr className="expanded-row" data-id={epi.id}>
                    <td colSpan="3">
                      <div className="expanded-details">
                        <p><strong>Condição:</strong> {epi.condicao || 'N/A'}</p>
                        <p><strong>Local de Uso:</strong> {epi.local_uso || 'N/A'}</p>
                        <p><strong>Disponibilidade:</strong> {epi.disponibilidade || 'N/A'}</p>
                        <p><strong>Data de Aquisição:</strong> {epi.data_aquisicao || 'N/A'}</p>
                        <p><strong>Validade:</strong> {epi.validade || 'N/A'}</p>
                        <p><strong>Nome/Código:</strong> {epi.nome || 'N/A'}</p>
                        <p><strong>Descrição:</strong> {epi.descricao || 'N/A'}</p>
                        <p><strong>Quantidade:</strong> {epi.quantidade || 'N/A'}</p>
                        <p><strong>Ano de Fabricação:</strong> {epi.ano_fabricacao || 'N/A'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TabelaEpi;