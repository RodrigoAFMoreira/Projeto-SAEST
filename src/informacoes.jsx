// src/informacoes.jsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/informacoes.css';
import protecaoCabecaImpactos from './assets/protecaoCabecaImpactos.png';
import segurancaPesPernas from './assets/segurancaPesPernas.png';
import imagem3 from './assets/imagem4.png';
import imagem4 from './assets/imagem5.png';
import imagem5 from './assets/imagem7.png';
import imagem6 from './assets/imagem1.png';
import imagem7 from './assets/protecaoMaos.png';
import EpiCardTemplate from './EpiCardTemplate';
import EpiCardCapacete from './epiCardCapacete';
import EpiCardOculos from './epiCardOculos';

//  debounce 
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// estrutura de dados modular para normas, EPIs,
const normasData = [
  {
    nrTitle: "NR 6 – EPI",
    sections: [
      {
        subTitle: "Proteção da Cabeça e Impactos",
        risks: "queda de objetos, batida contra estruturas",
        epis: [
          "Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)",
          "Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)",
          "Óculos com lentes escuras para solda (CA específico)",
          "Protetor facial tipo viseira de policarbonato",
        ],
        image: protecaoCabecaImpactos,
      },
      {
        subTitle: "Proteção das Mãos",
        risks: "cortes, abrasões, contato com cimento ou solventes",
        epis: [
          "Luva de raspa de couro (para manuseio de ferro/vergalhões)",
          "Luva de vaqueta (uso geral)",
          "Luva de borracha nitrílica (resistente a solventes/químicos)",
          "Luva anticorte (malha de aço ou fibra de vidro)",
        ],
        image: imagem7,
      },
    ],
  },
  {
    nrTitle: "NR 18 – Condições de Trabalho na Indústria da Construção",
    sections: [
      {
        subTitle: "Segurança dos Pés e Pernas",
        risks: "perfurações por pregos, esmagamento por materiais pesados",
        epis: [
          "Botina de segurança com biqueira de aço ou composite (ex: Bracol, Marluvas, Fujiwara)",
          "Botas impermeáveis de PVC (para cimento e umidade)",
        ],
        image: segurancaPesPernas,
      },
    ],
  },
  {
    nrTitle: "NR 10 – Segurança em Instalações Elétricas",
    sections: [
      {
        subTitle: "Segurança Elétrica",
        risks: "choques, curto-circuitos",
        epis: [
          "Luvas isolantes de borracha classe 00 a 2 (ex: KSL, Salisbury)",
          "Bota dielétrica (ex: Fujiwara – modelo ESD)",
          "Capacete com isolamento elétrico (classe B)",
        ],
        image: imagem3,
      },
    ],
  },
  {
    nrTitle: "NR 15 – Atividades e Operações Insalubres",
    sections: [
      {
        subTitle: "Proteção Respiratória (poeiras e vapores)",
        risks: "poeira de cimento, sílica, vapores de tinta/solvente",
        epis: [
          "Máscara PFF2 ou N95 (ex: 3M 8822, Delta Plus M1300V)",
          "Respirador semifacial com filtros químicos (para solventes e tintas)",
        ],
        image: imagem4,
      },
      {
        subTitle: "Proteção Auditiva",
        risks: "ruído de martelete, serra circular, betoneira",
        epis: [
          "Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)",
          "Abafador tipo concha (ex: MSA Excel, Peltor Optime)",
        ],
        image: imagem5,
      },
    ],
  },
  {
    nrTitle: "NR 35 – Trabalho em Altura",
    sections: [
      {
        subTitle: "Trabalho em Altura",
        risks: "quedas em andaimes, telhados e escadas",
        epis: [
          "Cinto de segurança tipo paraquedista (ex: Carbografite CG 760, MSA Workman)",
          "Talabarte com absorvedor de energia",
          "Trava-quedas retrátil",
        ],
        image: imagem6,
      },
    ],
  },
];

const Informacoes = () => {
  const navigate = useNavigate();
  const [selectedEpi, setSelectedEpi] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  
  const normalizeString = (str) => {
    return str
      .toLowerCase()
      .replace(/\s+/g, ''); // Remove todos os espaços
  };

  
  const filterCards = (nrTitle, subTitle, epis) => {
    if (!searchQuery) return true;

    // normaliza o texto da busca
    const queries = searchQuery
      .toLowerCase()
      .split(' ')
      .filter((q) => q)
      .map(normalizeString);

    const normalizedNrTitle = normalizeString(nrTitle);
    const normalizedSubTitle = subTitle ? normalizeString(subTitle) : '';
    const normalizedEpis = epis.map(normalizeString);

    return queries.every((query) =>
      normalizedNrTitle.includes(query) ||
      (normalizedSubTitle && normalizedSubTitle.includes(query)) ||
      normalizedEpis.some((epi) => epi.includes(query))
    );
  };

  const debouncedSetSearchQuery = debounce((value) => {
    setSearchQuery(value);
  }, 300);

  const filteredNormas = useMemo(() => {
    return normasData.map((norma) => ({
      ...norma,
      sections: norma.sections.filter((section) =>
        filterCards(norma.nrTitle, section.subTitle, section.epis)
      ),
    })).filter((norma) => norma.sections.length > 0);
  }, [searchQuery]);

  const handleClose = () => {
    setSelectedEpi(null);
  };

  return (
    <div className="informacoes-container">
      <header className="informacoes-header">
        <h1>Informações de Segurança</h1>
        <button className="back-button" onClick={() => navigate('/menu')}>
          Voltar
        </button>
      </header>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Pesquisar por NR, subtítulo ou EPI..."
          onChange={(e) => debouncedSetSearchQuery(e.target.value)}
        />
      </div>
      <div className="nr-cards-container">
        {filteredNormas.length === 0 ? (
          <div className="no-results">Nenhum resultado encontrado.</div>
        ) : (
          filteredNormas.map((norma) => (
            <div
              className="nr-card"
              key={norma.nrTitle}
              style={{ display: norma.sections.length > 0 ? 'block' : 'none' }}
            >
              <section className="informacoes-section">
                <h2>{norma.nrTitle}</h2>
                {norma.sections.map((section) => (
                  <div
                    className="inner-card"
                    key={section.subTitle}
                    style={{ display: filterCards(norma.nrTitle, section.subTitle, section.epis) ? 'block' : 'none' }}
                  >
                    <div className="info-item">
                      <div>
                        <h3>{section.subTitle}</h3>
                        <p><strong>Risco:</strong> {section.risks}</p>
                        <p><strong>EPIs (modelos):</strong></p>
                        <ul>
                          {section.epis.map((epi) => (
                            <li
                              key={epi}
                              className="epi-item"
                              onMouseEnter={() => setSelectedEpi(epi)}
                              onMouseLeave={() => setSelectedEpi(null)}
                              onClick={() => setSelectedEpi(selectedEpi === epi ? null : epi)}
                            >
                              {epi}
                              {selectedEpi === epi && (
                                <div className="epi-card-overlay">
                                  {epi === "Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)" ? (
                                    <EpiCardCapacete onClose={handleClose} />
                                  ) : epi === "Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)" ? (
                                    <EpiCardOculos onClose={handleClose} />
                                  ) : (
                                    <EpiCardTemplate onClose={handleClose} />
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <img src={section.image} alt={section.subTitle} />
                    </div>
                  </div>
                ))}
              </section>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Informacoes;