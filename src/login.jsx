import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./config/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    try {
      console.log('Attempting login for:', email); // Debugging
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      navigate('/menu');
    } catch (err) {
      console.error('Login error:', err);
      setMessage('Erro ao fazer login: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCadastroClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /cadastro'); // Debugging
    navigate('/cadastro');
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /esqueci-senha'); // Debugging
    navigate('/esqueci-senha');
  };

  return (
    <div className="container">
      <section className="left-section">
        <h1>SAEST</h1>
        <p>Protegendo pessoas, fortalecendo negócios</p>
      </section>

      <section className="right-section">
        <div className="login-container">
          <form id="login-form" onSubmit={handleSubmit} noValidate aria-describedby="mensagem-erro">
            <h2>Entrar</h2>
            <p>Faça login para acessar o sistema:</p>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>
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
              <label htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                placeholder="Senha"
                required
                aria-required="true"
                aria-describedby="password-error"
              />
              <span id="password-error" className="input-error" aria-live="polite"></span>
            </div>

            <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
              {message}
            </div>

            <button type="submit" disabled={isSubmitting} aria-label="Fazer login">
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            <p className="register-link">
              Não tem uma conta? <a href="#" onClick={handleCadastroClick}>Criar Conta</a>
            </p>
            <p className="forgot-password-link">
              Esqueceu sua senha? <a href="#" onClick={handleForgotPasswordClick}>Recuperar Senha</a>
            </p>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;