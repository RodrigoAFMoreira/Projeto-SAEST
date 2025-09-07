import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./config/supabaseClient";
import { validatePhoneNumber, validatePassword } from "./componentes/validacao";
import ForcaSenha from "./componentes/forcaSenha";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const registrarUsuario = async (email, senha, nome, tipo, telefone) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          data: {
            username: nome,
            tipo,
            telefone,
            criadoEm: new Date().toISOString(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase.from("usuarios").insert({
          id: data.user.id,
          nome,
          email,
          tipo,
          telefone,
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

    const erroTelefone = validatePhoneNumber(telefone);
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

    const errosSenha = validatePassword(senha, email, nome);
    if (errosSenha.length > 0) {
      setMessage("Senha inválida:\n" + errosSenha.join("\n"));
      return;
    }

    registrarUsuario(email, senha, nome, tipo, telefone);
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /login'); // Debugging
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
                <option value="" disabled selected hidden>
                  Selecione o tipo de usuário
                </option>
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

            <ForcaSenha password={senha} email={email} nome={nome} />

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