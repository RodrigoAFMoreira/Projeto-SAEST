import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./config/supabaseClient";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validarSenhaRobusta = (senha, email, nome) => {
    const erros = [];
    if (senha.length < 8) erros.push("Mínimo de 8 caracteres.");
    if (!/[A-Z]/.test(senha)) erros.push("Deve conter ao menos 1 letra maiúscula.");
    if (!/[a-z]/.test(senha)) erros.push("Deve conter ao menos 1 letra minúscula.");
    if (!/[0-9]/.test(senha)) erros.push("Deve conter ao menos 1 número.");
    if (!/[^A-Za-z0-9]/.test(senha)) erros.push("Deve conter ao menos 1 caractere especial.");
    if (/(.)\1{2,}/.test(senha)) erros.push("Não repita o mesmo caractere em sequência (ex: aaa).");

    const nomeLimpo = nome.toLowerCase().replace(/\s+/g, "");
    const emailParte = email.split("@")[0].toLowerCase();
    if (senha.toLowerCase().includes(nomeLimpo) || senha.toLowerCase().includes(emailParte)) {
      erros.push("A senha não deve conter seu nome ou e-mail.");
    }
    return erros;
  };

  const validarTelefone = (telefone) => {
    const regexTelefone = /^\(\d{2}\)\s?9\d{4}-\d{4}$/;
    if (!telefone) return "O campo telefone é obrigatório.";
    if (!regexTelefone.test(telefone)) return "Digite um telefone válido (ex: (11) 91234-5678).";
    return null;
  };

  const registrarUsuario = async (email, senha, nome, tipo, telefone) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            username: nome,
            tipo: tipo, // Will now be 'user', 'gestor', or 'administrador'
            telefone: telefone,
            criadoEm: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase.from('usuarios').insert({
          id: data.user.id,
          nome: nome,
          email: email,
          tipo: tipo, // Matches Supabase table values
          telefone: telefone,
        });

        if (insertError) throw insertError;

        navigate("/verificar-email");
      }
    } catch (err) {
      console.error("Erro ao registrar - Detalhes:", err);
      setMessage("Erro ao registrar: " + (err.message || "Erro desconhecido. Tente novamente."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const emailError = document.getElementById("email-error");
    const nomeError = document.getElementById("nome-error");
    const telefoneError = document.getElementById("telefone-error");
    const tipoError = document.getElementById("tipo-error");

    setMessage("");
    if (emailError) emailError.textContent = "";
    if (nomeError) nomeError.textContent = "";
    if (telefoneError) telefoneError.textContent = "";
    if (tipoError) tipoError.textContent = "";

    if (!email.includes("@") || !email.includes(".")) {
      setMessage("Digite um e-mail válido (ex: usuario@dominio.com)");
      if (emailError) emailError.textContent = "E-mail inválido.";
      return;
    }

    if (!nome) {
      setMessage("Preencha seu nome completo.");
      if (nomeError) nomeError.textContent = "Nome é obrigatório.";
      return;
    }

    const erroTelefone = validarTelefone(telefone);
    if (erroTelefone) {
      setMessage(erroTelefone);
      if (telefoneError) telefoneError.textContent = erroTelefone;
      return;
    }

    if (!tipo) {
      setMessage("Selecione o tipo de usuário.");
      if (tipoError) tipoError.textContent = "Tipo de usuário é obrigatório.";
      return;
    }

    const errosSenha = validarSenhaRobusta(senha, email, nome);
    if (errosSenha.length > 0) {
      setMessage("Senha inválida:\n" + errosSenha.join("\n"));
      return;
    }

    registrarUsuario(email, senha, nome, tipo, telefone);
  };

  const [strength, setStrength] = useState(0);
  useEffect(() => {
    const calcularForcaSenha = (senha) => {
      let pontos = 0;
      if (senha.length >= 8) pontos++;
      if (/[A-Z]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos++;
      if (/\d/.test(senha)) pontos++;
      return pontos;
    };
    const forca = calcularForcaSenha(senha);
    setStrength(forca);
  }, [senha]);

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
      case "min-caracteres": return senha.length >= 8;
      case "maiuscula": return /[A-Z]/.test(senha);
      case "minuscula": return /[a-z]/.test(senha);
      case "numero": return /\d/.test(senha);
      case "especial": return /[^A-Za-z0-9]/.test(senha);
      case "repeticao": return !/(.)\1\1/.test(senha);
      default: return false;
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <div className="container">
      <section className="left-section">
        <h1>SAEST</h1>
        <p>Protegendo pessoas, fortalecendo negócios</p>
      </section>

      <section className="right-section">
        <div className="login-container">
          <form id="cadastro-form" onSubmit={handleSubmit} noValidate aria-describedby="mensagem-erro">
            <h2>Criar Conta</h2>
            <p>Preencha os campos abaixo para criar sua conta:</p>

            <div className="input-group">
              <select
                id="tipoUsuario"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                required
                aria-required="true"
                aria-describedby="tipo-error"
              >
                <option value="" disabled selected hidden>Selecione o tipo de usuário</option>
                <option value="administrador">Administrador</option>
                <option value="gestor">Gestor de Segurança</option>
                <option value="user">Funcionário</option>
              </select>
              <span id="tipo-error" className="input-error" aria-live="polite"></span>
            </div>

            <div className="input-group">
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value.trim())}
                placeholder="Nome completo"
                required
                aria-required="true"
                aria-describedby="nome-error"
              />
              <span id="nome-error" className="input-error" aria-live="polite"></span>
            </div>

            <div className="input-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="E-mail"
                required
                aria-required="true"
                aria-describedby="email-error"
              />
              <span id="email-error" className="input-error" aria-live="polite"></span>
            </div>

            <div className="input-group">
              <input
                type="tel"
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value.trim())}
                placeholder="Telefone (ex: (11) 91234-5678)"
                required
                aria-required="true"
                aria-describedby="telefone-error"
              />
              <span id="telefone-error" className="input-error" aria-live="polite"></span>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value.trim())}
                placeholder="Senha"
                required
                aria-required="true"
                aria-describedby="senha-status senha-requisitos mensagem-erro"
              />
            </div>

            <div className="senha-status" id="senha-status" aria-live="polite" style={{ display: senha ? "block" : "none" }}>
              <div
                className="forca-barra"
                id="strength-bar"
                style={{ width: updatePasswordStrength().width, backgroundColor: updatePasswordStrength().backgroundColor }}
                aria-hidden="true"
              />
                <div className="forca-texto" id="strength-text">{updatePasswordStrength().text}</div>
            </div>

            <ul id="senha-requisitos" className="senha-requisitos" style={{ display: senha ? "block" : "none" }}>
              <li data-regra="min-caracteres" className={checkRequirement("min-caracteres", senha) ? "valido" : ""}>
                Mínimo de 8 caracteres
              </li>
              <li data-regra="maiuscula" className={checkRequirement("maiuscula", senha) ? "valido" : ""}>
                Letra maiúscula
              </li>
              <li data-regra="minuscula" className={checkRequirement("minuscula", senha) ? "valido" : ""}>
                Letra minúscula
              </li>
              <li data-regra="numero" className={checkRequirement("numero", senha) ? "valido" : ""}>
                Número
              </li>
              <li data-regra="especial" className={checkRequirement("especial", senha) ? "valido" : ""}>
                Caractere especial
              </li>
              <li data-regra="repeticao" className={checkRequirement("repeticao", senha) ? "valido" : ""}>
                Sem repetições (ex: aaa)
              </li>
            </ul>

            <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
              {message}
            </div>

            <button type="submit" disabled={isSubmitting} aria-label="Cadastrar nova conta">
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </button>

            <p className="register-link">
              Já tem uma conta? <a href="#" onClick={handleLoginClick}>Entrar</a>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Cadastro;