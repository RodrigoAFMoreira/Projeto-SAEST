// src/epiCardCapacete.jsx
import React from "react";
import capaceteImage from "./assets/capaceteDeSegurancaComJugular.png";
import "./css/epiCard.css";

const EpiCardCapacete = ({ onClose }) => {
  return (
    <div className="epi-card">
      <div className="card-content">
        <img src={capaceteImage} alt="Capacete de Segurança com Jugular" className="card-image" />
        <div className="card-text">
          <h3>Capacete de Segurança com Jugular</h3>
          <p><strong>Uso:</strong> Protege a cabeça contra quedas de objetos, impactos contra estruturas e outros riscos em ambientes de construção.</p>
          <p><strong>Importância:</strong> Essencial para prevenir lesões graves, como traumatismos cranianos, garantindo segurança em trabalhos em altura ou áreas com risco de queda de materiais.</p>
          <p><strong>Exemplos:</strong> V-Gard da MSA, Delta Plus.</p>
        </div>
      </div>
      <button className="close-button" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
};

export default EpiCardCapacete;