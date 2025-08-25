import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./config/supabaseClient";
import "./index.css"; 

const EsqueciSenha = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const showFeedback = (message, isError = false) => {
    setMessage({ text: message, isError });
    if (!isError) {
      setTimeout(() => setMessage(""), 5000); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      showFeedback("Por favor, insira um e-mail válido.", true);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`, 
      });

      if (error) throw error;

      showFeedback("✓ E-mail de recuperação enviado com sucesso!");
      setEmail("");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error.message);
      let msg = "Erro ao enviar o e-mail. Tente novamente.";

      if (error.message.includes("user not found")) {
        msg = "Este e-mail não está cadastrado.";
      } else if (error.message.includes("too many requests")) {
        msg = "Muitas tentativas. Tente mais tarde.";
      }

      showFeedback(msg, true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoltarLogin = (e) => {
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
          <header>
            <h2>Recuperar Senha</h2>
            <p>Informe seu e-mail para redefinir sua senha</p>
          </header>

          <form id="resetForm" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  aria-describedby="mensagem"
                />
              </label>
            </div>

            <div className="input-group">
              <button type="submit" id="btnEnviar" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar"}
              </button>
            </div>

            <div className="form-links">
              <a href="#" onClick={handleVoltarLogin} className="forgot-password">
                Voltar ao login
              </a>
            </div>

            {message && (
              <p id="mensagem" className={`mensagem ${message.isError ? "error" : "success"}`} aria-live="assertive">
                {message.text}
              </p>
            )}
          </form>
        </div>
      </section>
    </div>
  );
};

export default EsqueciSenha;