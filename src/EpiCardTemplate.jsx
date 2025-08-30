// src/EpiCardTemplate.jsx
import React from "react";
import templateImage from "./assets/template.png";
import "./css/epiCardTemplate.css";

const EpiCardTemplate = ({ onClose }) => {
  return (
    <div className="epi-card-template">
      <div className="card-content">
        <img src={templateImage} alt="Template Image" className="template-image" />
        <div className="template-text">
          <p>Este é um template de exemplo.</p>
          <p>Ele serve como base para exibir informações</p>
          <p>sobre EPIs no futuro. Cada EPI poderá ter</p>
          <p>um conteúdo único, mas por agora é genérico.</p>
        </div>
      </div>
      <button className="close-button" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
};

export default EpiCardTemplate;