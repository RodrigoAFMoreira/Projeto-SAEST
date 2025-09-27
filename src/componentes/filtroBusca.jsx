// usado em epi.jsx
// Componente de barra de pesquisa estática

import React, { useState } from 'react';

function debouncer(func, espera) {
  let temporizador;
  return function funcaoExecutada(...args) {
    const posterior = () => {
      clearTimeout(temporizador);
      func(...args);
    };
    clearTimeout(temporizador);
    temporizador = setTimeout(posterior, espera);
  };
}

const FiltroPesquisa = ({ aoPesquisar }) => {
  const [termoPesquisa, definirTermoPesquisa] = useState('');
  const normalizarString = (str) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, '');
  };

  const filtrarCards = (tituloNr, subtitulo, epis) => {
    if (!termoPesquisa) return true;

    const termos = termoPesquisa
      .toLowerCase()
      .split(' ')
      .filter((q) => q)
      .map(normalizarString);

    const tituloNrNormalizado = normalizarString(tituloNr);
    const subtituloNormalizado = subtitulo ? normalizarString(subtitulo) : '';
    const episNormalizados = epis.map(normalizarString);

    return termos.every((termo) =>
      tituloNrNormalizado.includes(termo) ||
      (subtituloNormalizado && subtituloNormalizado.includes(termo)) ||
      episNormalizados.some((epi) => epi.includes(termo))
    );
  };

  const debouncerDefinirTermoPesquisa = debouncer((valor) => {
    definirTermoPesquisa(valor);
    aoPesquisar(filtrarCards, valor);
  }, 300);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Pesquisar por NR, subtítulo ou EPI..."
        onChange={(e) => debouncerDefinirTermoPesquisa(e.target.value)}
      />
    </div>
  );
};

export default FiltroPesquisa;