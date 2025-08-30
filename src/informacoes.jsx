import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/informacoes.css';
import imagem1 from './assets/imagem2.png';
import imagem2 from './assets/imagem3.png';
import imagem3 from './assets/imagem4.png';
import imagem4 from './assets/imagem5.png';
import imagem5 from './assets/imagem7.png';
import imagem6 from './assets/imagem1.png';
import imagem7 from './assets/imagem8.png';
import EpiCardTemplate from './EpiCardTemplate'; 

const Informacoes = () => {
  const navigate = useNavigate();
  const [selectedEpi, setSelectedEpi] = useState(null);

  const handleEpiInteraction = (epi) => {
    setSelectedEpi(selectedEpi === epi ? null : epi);
  };

  return (
    <div className="informacoes-container">
      <header className="informacoes-header">
        <h1>Informações de Segurança</h1>
        <button className="back-button" onClick={() => navigate('/menu')}>
          Voltar
        </button>
      </header>
      <section className="informacoes-section">
        <h2>NR 6 – EPI</h2>
        <div className="info-item">
          <div>
            <h3>Proteção da Cabeça e Impactos</h3>
            <p><strong>Risco:</strong> queda de objetos, batida contra estruturas.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)")}
              >
                Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)
                {selectedEpi === "Capacete de segurança com jugular (ex: V-Gard da MSA, Delta Plus)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)")}
              >
                Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)
                {selectedEpi === "Óculos de segurança incolor (ex: Kalunga Jaguar, 3M Virtua)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Óculos com lentes escuras para solda (CA específico)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Óculos com lentes escuras para solda (CA específico)")}
              >
                Óculos com lentes escuras para solda (CA específico)
                {selectedEpi === "Óculos com lentes escuras para solda (CA específico)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Protetor facial tipo viseira de policarbonato")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Protetor facial tipo viseira de policarbonato")}
              >
                Protetor facial tipo viseira de policarbonato
                {selectedEpi === "Protetor facial tipo viseira de policarbonato" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem1} alt="NR 6 - Proteção da Cabeça e Impactos" />
        </div>
        <div className="info-item">
          <div>
            <h3>Proteção das Mãos</h3>
            <p><strong>Risco:</strong> cortes, abrasões, contato com cimento ou solventes.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Luva de raspa de couro (para manuseio de ferro/vergalhões)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Luva de raspa de couro (para manuseio de ferro/vergalhões)")}
              >
                Luva de raspa de couro (para manuseio de ferro/vergalhões)
                {selectedEpi === "Luva de raspa de couro (para manuseio de ferro/vergalhões)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Luva de vaqueta (uso geral)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Luva de vaqueta (uso geral)")}
              >
                Luva de vaqueta (uso geral)
                {selectedEpi === "Luva de vaqueta (uso geral)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Luva de borracha nitrílica (resistente a solventes/químicos)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Luva de borracha nitrílica (resistente a solventes/químicos)")}
              >
                Luva de borracha nitrílica (resistente a solventes/químicos)
                {selectedEpi === "Luva de borracha nitrílica (resistente a solventes/químicos)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Luva anticorte (malha de aço ou fibra de vidro)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Luva anticorte (malha de aço ou fibra de vidro)")}
              >
                Luva anticorte (malha de aço ou fibra de vidro)
                {selectedEpi === "Luva anticorte (malha de aço ou fibra de vidro)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem7} alt="NR 6 - Proteção das Mãos" />
        </div>
      </section>
      <section className="informacoes-section">
        <h2>NR 18 – Condições de Trabalho na Indústria da Construção</h2>
        <div className="info-item">
          <div>
            <h3>Segurança dos Pés e Pernas</h3>
            <p><strong>Risco:</strong> perfurações por pregos, esmagamento por materiais pesados.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Botina de segurança com biqueira de aço ou composite (ex: Bracol, Marluvas, Fujiwara)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Botina de segurança com biqueira de aço ou composite (ex: Bracol, Marluvas, Fujiwara)")}
              >
                Botina de segurança com biqueira de aço ou composite (ex: Bracol, Marluvas, Fujiwara)
                {selectedEpi === "Botina de segurança com biqueira de aço ou composite (ex: Bracol, Marluvas, Fujiwara)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Botas impermeáveis de PVC (para cimento e umidade)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Botas impermeáveis de PVC (para cimento e umidade)")}
              >
                Botas impermeáveis de PVC (para cimento e umidade)
                {selectedEpi === "Botas impermeáveis de PVC (para cimento e umidade)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem2} alt="NR 18 - Segurança dos Pés e Pernas" />
        </div>
      </section>
      <section className="informacoes-section">
        <h2>NR 10 – Segurança em Instalações Elétricas</h2>
        <div className="info-item">
          <div>
            <h3>Segurança Elétrica</h3>
            <p><strong>Risco:</strong> choques, curto-circuitos.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Luvas isolantes de borracha classe 00 a 2 (ex: KSL, Salisbury)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Luvas isolantes de borracha classe 00 a 2 (ex: KSL, Salisbury)")}
              >
                Luvas isolantes de borracha classe 00 a 2 (ex: KSL, Salisbury)
                {selectedEpi === "Luvas isolantes de borracha classe 00 a 2 (ex: KSL, Salisbury)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Bota dielétrica (ex: Fujiwara – modelo ESD)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Bota dielétrica (ex: Fujiwara – modelo ESD)")}
              >
                Bota dielétrica (ex: Fujiwara – modelo ESD)
                {selectedEpi === "Bota dielétrica (ex: Fujiwara – modelo ESD)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Capacete com isolamento elétrico (classe B)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Capacete com isolamento elétrico (classe B)")}
              >
                Capacete com isolamento elétrico (classe B)
                {selectedEpi === "Capacete com isolamento elétrico (classe B)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem3} alt="NR 10 - Segurança Elétrica" />
        </div>
      </section>
      <section className="informacoes-section">
        <h2>NR 15 – Atividades e Operações Insalubres</h2>
        <div className="info-item">
          <div>
            <h3>Proteção Respiratória (poeiras e vapores)</h3>
            <p><strong>Risco:</strong> poeira de cimento, sílica, vapores de tinta/solvente.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Máscara PFF2 ou N95 (ex: 3M 8822, Delta Plus M1300V)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Máscara PFF2 ou N95 (ex: 3M 8822, Delta Plus M1300V)")}
              >
                Máscara PFF2 ou N95 (ex: 3M 8822, Delta Plus M1300V)
                {selectedEpi === "Máscara PFF2 ou N95 (ex: 3M 8822, Delta Plus M1300V)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Respirador semifacial com filtros químicos (para solventes e tintas)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Respirador semifacial com filtros químicos (para solventes e tintas)")}
              >
                Respirador semifacial com filtros químicos (para solventes e tintas)
                {selectedEpi === "Respirador semifacial com filtros químicos (para solventes e tintas)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem4} alt="NR 15 - Proteção Respiratória" />
        </div>
        <div className="info-item">
          <div>
            <h3>Proteção Auditiva</h3>
            <p><strong>Risco:</strong> ruído de martelete, serra circular, betoneira.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)")}
              >
                Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)
                {selectedEpi === "Protetor auricular tipo plug (espuma 3M 1100, MSA Classic)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Abafador tipo concha (ex: MSA Excel, Peltor Optime)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Abafador tipo concha (ex: MSA Excel, Peltor Optime)")}
              >
                Abafador tipo concha (ex: MSA Excel, Peltor Optime)
                {selectedEpi === "Abafador tipo concha (ex: MSA Excel, Peltor Optime)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem5} alt="NR 15 - Proteção Auditiva" />
        </div>
      </section>
      <section className="informacoes-section">
        <h2>NR 35 – Trabalho em Altura</h2>
        <div className="info-item">
          <div>
            <h3>Trabalho em Altura</h3>
            <p><strong>Risco:</strong> quedas em andaimes, telhados e escadas.</p>
            <p><strong>EPIs (modelos):</strong></p>
            <ul>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Cinto de segurança tipo paraquedista (ex: Carbografite CG 760, MSA Workman)")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Cinto de segurança tipo paraquedista (ex: Carbografite CG 760, MSA Workman)")}
              >
                Cinto de segurança tipo paraquedista (ex: Carbografite CG 760, MSA Workman)
                {selectedEpi === "Cinto de segurança tipo paraquedista (ex: Carbografite CG 760, MSA Workman)" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Talabarte com absorvedor de energia")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Talabarte com absorvedor de energia")}
              >
                Talabarte com absorvedor de energia
                {selectedEpi === "Talabarte com absorvedor de energia" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
              <li
                className="epi-item"
                onMouseEnter={() => setSelectedEpi("Trava-quedas retrátil")}
                onMouseLeave={() => setSelectedEpi(null)}
                onClick={() => handleEpiInteraction("Trava-quedas retrátil")}
              >
                Trava-quedas retrátil
                {selectedEpi === "Trava-quedas retrátil" && (
                  <div className="epi-card-overlay">
                    <EpiCardTemplate onClose={() => setSelectedEpi(null)} />
                  </div>
                )}
              </li>
            </ul>
          </div>
          <img src={imagem6} alt="NR 35 - Trabalho em Altura" />
        </div>
      </section>
    </div>
  );
};

export default Informacoes;