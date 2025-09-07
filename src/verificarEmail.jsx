import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import './css/verificarEmail.css';

const VerificarEmail = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifique seu e-mail para continuar.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao verificar sessão:', error.message);
        setMessage('Erro ao verificar sessão. Tente novamente.');
        return;
      }
      if (session?.user?.email_confirmed_at) {
        setMessage('E-mail verificado! Redirecionando para o login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    const handleAuthEvent = async ({ event, session }) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        setMessage('E-mail verificado! Redirecionando para o login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthEvent);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleResendEmail = async () => {
    setIsSubmitting(true);
    setMessage('');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setMessage('Nenhum usuário encontrado. Por favor, faça login novamente.');
        setIsSubmitting(false);
        return;
      }
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
        options: { emailRedirectTo: `${window.location.origin}/verificar-email` },
      });
      if (resendError) throw resendError;
      setMessage('E-mail de verificação reenviado. Verifique sua caixa de entrada ou spam.');
    } catch (err) {
      setMessage('Erro ao reenviar e-mail: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
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
          <h2>Verificar E-mail</h2>
          <p>
            Um e-mail de verificação foi enviado para sua caixa de entrada. Por favor, clique no link para verificar seu e-mail.
          </p>
          <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
            {message}
          </div>
          <button
            type="button"
            onClick={handleResendEmail}
            disabled={isSubmitting}
            aria-label="Reenviar e-mail de verificação"
          >
            {isSubmitting ? 'Enviando...' : 'Reenviar E-mail'}
          </button>
          <p className="register-link">
            Voltar para o login? <a href="#" onClick={handleLoginClick}>Entrar</a>
          </p>
        </div>
      </section>
    </div>
  );
};

export default VerificarEmail;