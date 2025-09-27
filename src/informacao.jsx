// src/informacao.jsx
// Página de informações de segurança para user

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/informacao.css';
import protecaoCabecaImpacto from './assets/protecaoCabecaImpacto.png';
import segurancaPerna from './assets/segurancaPerna.png';
import protecaoEletrica from './assets/protecaoEletrica.png';
import protecaoRespiratoria from './assets/protecaoRespiratoria.png';
import ProtecaoAuditiva from './assets/ProtecaoAuditiva.png';
import protecaoAltura from './assets/protecaoAltura.png';
import protecaoMao from './assets/protecaoMao.png';
import EpiCardTemplate from './EpiCardTemplate';
import EpiCardCapacete from './epiCardCapacete';
import EpiCardOculos from './epiCardOculos';
import SearchFilter from './componentes/filtroBusca'; 

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
        image: protecaoCabecaImpacto,
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
        image: protecaoMao,
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
        image: segurancaPerna,
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
        image: protecaoEletrica,
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
        image: protecaoRespiratoria,
      },
      {
        subTitle: "Proteção Auditiva",
        risks: "ruído de martelete, serra circular, betoneira",
        epis: [
          "Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)",
          "Abafador tipo concha (ex: MSA Excel, Peltor Optime)",
        ],
        image: ProtecaoAuditiva,
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
        image: protecaoAltura,
      },
    ],
  },
];

const Informacao = () => {
  const navigate = useNavigate();
  const [selectedEpi, setSelectedEpi] = useState(null);
  const [filteredNormas, setFilteredNormas] = useState(normasData);
  const handleSearch = (filterCards, searchQuery) => {
    const filtered = normasData.map((norma) => ({
      ...norma,
      sections: norma.sections.filter((section) =>
        filterCards(norma.nrTitle, section.subTitle, section.epis)
      ),
    })).filter((norma) => norma.sections.length > 0);
    setFilteredNormas(filtered);
  };

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
      <SearchFilter onSearch={handleSearch} /> {/* componente filtroBusca */}
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

export default Informacao;