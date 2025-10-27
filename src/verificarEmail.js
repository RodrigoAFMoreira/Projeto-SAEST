// src/verificarEmail.js
import supabase from './config/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const messageElement = document.getElementById('mensagem-erro');
  const resendButton = document.getElementById('resend-email-btn');
  const loginLink = document.getElementById('login-link');
  let isSubmitting = false;

  const setMessage = (text) => {
    messageElement.textContent = text;
  };

  const navigateToLogin = () => {
    setMessage('E-mail verificado! Redirecionando para o login...');
    setTimeout(() => {
      window.location.href = '/login';
    }, 6000);
  };

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Erro ao verificar sessão:', error.message);
        setMessage('Erro ao verificar sessão. Tente novamente.');
        return;
      }
      if (session?.user?.email_confirmed_at) {
        navigateToLogin();
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setMessage('Erro inesperado. Tente novamente.');
    }
  };

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
      navigateToLogin();
    }
  });

  const handleResendEmail = async () => {
    if (isSubmitting) return;
    isSubmitting = true;
    resendButton.textContent = 'Enviando...';
    resendButton.disabled = true;
    setMessage('');

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        setMessage('Nenhum usuário encontrado. Por favor, faça login novamente.');
        isSubmitting = false;
        resendButton.textContent = 'Reenviar E-mail';
        resendButton.disabled = false;
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
      isSubmitting = false;
      resendButton.textContent = 'Reenviar E-mail';
      resendButton.disabled = false;
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
  };

  checkSession();

  resendButton.addEventListener('click', handleResendEmail);
  loginLink.addEventListener('click', handleLoginClick);

  window.addEventListener('unload', () => {
    authListener.subscription?.unsubscribe();
  });
});