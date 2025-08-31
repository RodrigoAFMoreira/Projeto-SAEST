// src/epiCardOculos.jsx
import React from "react";
import oculosImage from "./assets/oculosDeSegurancaIncolor.png";
import "./css/epiCard.css";

const EpiCardOculos = ({ onClose }) => {
  return (
    <div className="epi-card">
      <div className="card-content">
        <img src={oculosImage} alt="Óculos de Segurança Incolor" className="card-image" />
        <div className="card-text">
          <h3>Óculos de Segurança Incolor</h3>
          <p><strong>Uso:</strong> Protege os olhos contra partículas, poeira, e impactos leves em ambientes de construção ou industriais.</p>
          <p><strong>Importância:</strong> Essencial para prevenir lesões oculares, como arranhões ou corpos estranhos, garantindo visão clara e segurança em tarefas diárias.</p>
          <p><strong>Exemplos:</strong> Kalunga Jaguar, 3M Virtua.</p>
        </div>
      </div>
      <button className="close-button" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
};

export default EpiCardOculos;