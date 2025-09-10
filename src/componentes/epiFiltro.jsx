// usado em epi.jsx
// Este componente fornece filtros para a lista de EPIs, permitindo buscas por vários critérios.
import React from 'react';

const EpiFiltro = ({ filtros = {}, aoAlterarFiltros, abrirModalAdicionar, abrirModalGerenciar }) => {
  const safeFiltros = filtros || {
    'filtro-tipo': '',
    'filtro-condicao': '',
    'filtro-local-uso': '',
    'filtro-disponibilidade': '',
    'filtro-validade': '',
    'filtro-codigo': '',
  };

  return (
    <div className="filter-bar">
      <input
        type="text"
        id="filtro-codigo"
        placeholder="Pesquisar por código ou nome..."
        value={safeFiltros['filtro-codigo'] || ''}
        onChange={aoAlterarFiltros}
      />
      <select
        id="filtro-tipo"
        value={safeFiltros['filtro-tipo'] || ''}
        onChange={aoAlterarFiltros}
      >
        <option value="">Todos os Tipos</option>
        <option value="capacete">Capacete</option>
        <option value="luvas">Luvas</option>
        <option value="botas">Botas</option>
        <option value="mascara">Máscara</option>
        <option value="oculos">Óculos de Proteção</option>
      </select>
      <select
        id="filtro-condicao"
        value={safeFiltros['filtro-condicao'] || ''}
        onChange={aoAlterarFiltros}
      >
        <option value="">Todas as Condições</option>
        <option value="Novo">Novo</option>
        <option value="Usado">Usado</option>
      </select>
      <select
        id="filtro-local-uso"
        value={safeFiltros['filtro-local-uso'] || ''}
        onChange={aoAlterarFiltros}
      >
        <option value="">Todos os Locais</option>
        <option value="canteiro">Canteiro de Obras</option>
        <option value="armazem">Armazém</option>
        <option value="escritorio">Escritório</option>
        <option value="manutencao">Manutenção</option>
      </select>
      <select
        id="filtro-disponibilidade"
        value={safeFiltros['filtro-disponibilidade'] || ''}
        onChange={aoAlterarFiltros}
      >
        <option value="">Todas as Disponibilidades</option>
        <option value="Em Estoque">Em Estoque</option>
        <option value="Em Uso">Em Uso</option>
        <option value="Indisponível">Indisponível</option>
      </select>
      <select
        id="filtro-validade"
        value={safeFiltros['filtro-validade'] || ''}
        onChange={aoAlterarFiltros}
      >
        <option value="">Todas as Validades</option>
        <option value="válido">Válido</option>
        <option value="expirado">Expirado</option>
        <option value="sem-validade">Sem Validade</option>
      </select>
      <button onClick={abrirModalAdicionar} className="btn primary">
        Adicionar EPI
      </button>
      <button onClick={abrirModalGerenciar} className="btn secondary">
        Gerenciar Opções
      </button>
    </div>
  );
};

export default EpiFiltro;