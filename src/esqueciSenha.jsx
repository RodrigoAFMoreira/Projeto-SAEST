import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from './config/supabaseClient';
import { validatePhoneNumber, validatePassword } from "./componentes/validacao";
import ForcaSenha from "./componentes/forcaSenha";
import './css/esqueciSenha.css';

const EsqueciSenha = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const tokenRef = useRef(null); 

  useEffect(() => {
    console.log('EsqueciSenha useEffect, hash:', location.hash);
    if (tokenRef.current) {
      console.log('Token already processed:', tokenRef.current);
      return;
    }

    const hashParams = new URLSearchParams(location.hash.replace('#', ''));
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (error || errorCode || errorDescription) {
      console.log('Error in URL:', { error, errorCode, errorDescription });
      setMessage('Link de redefinição inválido ou expirado. Por favor, solicite um novo e-mail de recuperação.');
      setIsResetMode(false);
      tokenRef.current = 'error';
      return;
    }

    // Check valido token rest
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    if (accessToken && type === 'recovery') {
      console.log('Valid reset token detected, verifying session');
      tokenRef.current = accessToken;
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error || !session) {
          console.log('Invalid session:', error);
          setMessage('Sessão inválida ou expirada. Solicite um novo link de redefinição.');
          setIsResetMode(false);
          tokenRef.current = 'invalid';
        } else {
          console.log('Valid session, enabling reset mode');
          setIsResetMode(true);
          setEmail(session.user.email || '');
        }
      });
    } else {
      console.log('No valid reset token, setting reset mode to false');
      setIsResetMode(false);
      tokenRef.current = 'none';
    }
  }, [location]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session);
      if (event === 'SIGNED_IN' && session && tokenRef.current && tokenRef.current !== 'error' && tokenRef.current !== 'invalid') {
        setIsResetMode(true);
        setEmail(session.user.email || '');
      } else if (event === 'SIGNED_OUT' || !session) {
        setIsResetMode(false);
        setMessage('Sessão expirada. Solicite um novo link de redefinição.');
        tokenRef.current = 'invalid';
      }
    });

    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, []);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    if (!email.includes('@') || !email.includes('.')) {
      setMessage('Digite um e-mail válido (ex: usuario@dominio.com)');
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Sending reset email for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/esqueci-senha`,
      });
      if (error) throw error;
      setMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada ou spam.');
      setEmail('');
    } catch (err) {
      console.error('Error sending reset email:', err);
      setMessage('Erro ao enviar e-mail de recuperação: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    if (!newPassword || !confirmPassword) {
      setMessage('Preencha ambos os campos de senha.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('As senhas não coincidem.');
      setIsSubmitting(false);
      return;
    }

    const errosSenha = validatePassword(newPassword, email, '');
    if (errosSenha.length > 0) {
      setMessage('Senha inválida:\n' + errosSenha.join('\n'));
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('Attempting to update password');
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      console.log('Update user response:', { data, error });
      if (error) throw error;
      setMessage('Senha atualizada com sucesso! Você será redirecionado para o login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Error updating password:', err);
      setMessage('Erro ao atualizar senha: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /login');
    navigate('/login');
  };

  return (
    <div className="container">
      <section className="left-section">
        <h1>SAEST</h1>
        <p>Protegendo pessoas, fortalecendo negócios</p>
      </section>

      <section className="right-section">
        <div className="login-container">
          {isResetMode ? (
            <form id="reset-password-form" onSubmit={handleUpdatePassword} noValidate aria-describedby="mensagem-erro">
              <h2>Redefinir Senha</h2>
              <p>Digite sua nova senha abaixo:</p>

              <div className="input-group">
                <label htmlFor="new-password">Nova Senha</label>
                <input
                  type="password"
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.trim())}
                  placeholder="Nova senha"
                  required
                  aria-required="true"
                  aria-describedby="senha-status senha-requisitos mensagem-erro"
                />
                <span id="new-password-error" className="input-error" aria-live="polite"></span>
              </div>

              <ForcaSenha password={newPassword} email={email} nome="" />

              <div className="input-group">
                <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value.trim())}
                  placeholder="Confirmar nova senha"
                  required
                  aria-required="true"
                  aria-describedby="confirm-password-error mensagem-erro"
                />
                <span id="confirm-password-error" className="input-error" aria-live="polite"></span>
              </div>

              <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
                {message}
              </div>

              <button type="submit" disabled={isSubmitting} aria-label="Redefinir senha">
                {isSubmitting ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>

              <p className="register-link">
                Voltar para o login? <a href="#" onClick={handleLoginClick}>Entrar</a>
              </p>
            </form>
          ) : (
            <form id="request-reset-form" onSubmit={handleSendResetEmail} noValidate aria-describedby="mensagem-erro">
              <h2>Recuperar Senha</h2>
              <p>Digite seu e-mail para receber um link de redefinição de senha:</p>

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

              <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
                {message}
              </div>

              <button type="submit" disabled={isSubmitting} aria-label="Enviar e-mail de recuperação">
                {isSubmitting ? 'Enviando...' : 'Enviar E-mail'}
              </button>

              <p className="register-link">
                Voltar para o login? <a href="#" onClick={handleLoginClick}>Entrar</a>
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default EsqueciSenha;