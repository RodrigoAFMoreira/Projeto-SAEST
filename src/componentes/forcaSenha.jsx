// em uso em cadastro.jsx, login.jsx, e esqueciSenha.jsx
// Indicador de força da senha com requisitos

import React, { useState, useEffect } from "react";

const PasswordStrengthIndicator = ({ password, email, nome }) => {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const calcularForcaSenha = (senha) => {
      let pontos = 0;
      if (senha.length >= 8) pontos++;
      if (/[A-Z]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos++;
      if (/\d/.test(senha)) pontos++;
      return pontos;
    };
    const forca = calcularForcaSenha(password);
    setStrength(forca);
  }, [password]);

  const updatePasswordStrength = () => {
    const cores = ["#e63946", "#f4a261", "#2a9d8f"];
    const textos = ["Fraca", "Média", "Forte"];
    const porcentagens = ["33%", "66%", "100%"];
    return strength > 0
      ? { width: porcentagens[strength - 1], backgroundColor: cores[strength - 1], text: textos[strength - 1] }
      : { width: "0%", backgroundColor: "transparent", text: "" };
  };

  const checkRequirement = (rule, senha) => {
    switch (rule) {
      case "min-caracteres":
        return senha.length >= 8;
      case "maiuscula":
        return /[A-Z]/.test(senha);
      case "minuscula":
        return /[a-z]/.test(senha);
      case "numero":
        return /\d/.test(senha);
      case "especial":
        return /[^A-Za-z0-9]/.test(senha);
      case "repeticao":
        return !/(.)\1\1/.test(senha);
      default:
        return false;
    }
  };

  return (
    <>
      <div className="senha-status" style={{ display: password ? "block" : "none" }} aria-live="polite">
        <div
          className="forca-barra"
          style={{ width: updatePasswordStrength().width, backgroundColor: updatePasswordStrength().backgroundColor }}
          aria-hidden="true"
        />
        <div className="forca-texto">{updatePasswordStrength().text}</div>
      </div>
      <ul className="senha-requisitos" style={{ display: password ? "block" : "none" }}>
        <li className={checkRequirement("min-caracteres", password) ? "valido" : ""}>Mínimo de 8 caracteres</li>
        <li className={checkRequirement("maiuscula", password) ? "valido" : ""}>Letra maiúscula</li>
        <li className={checkRequirement("minuscula", password) ? "valido" : ""}>Letra minúscula</li>
        <li className={checkRequirement("numero", password) ? "valido" : ""}>Número</li>
        <li className={checkRequirement("especial", password) ? "valido" : ""}>Caractere especial</li>
        <li className={checkRequirement("repeticao", password) ? "valido" : ""}>Sem repetições (ex: aaa)</li>
      </ul>
    </>
  );
};

export default PasswordStrengthIndicator;