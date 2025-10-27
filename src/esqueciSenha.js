// src/esqueciSenha.js

import supabase from './config/supabaseClient.js';
import { validatePassword } from './componentes/validacao.jsx';

document.addEventListener('DOMContentLoaded', () => {
  const requestResetForm = document.getElementById('request-reset-form');
  const resetPasswordForm = document.getElementById('reset-password-form');
  const emailInput = document.getElementById('email');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const sendResetBtn = document.getElementById('send-reset-btn');
  const resetPasswordBtn = document.getElementById('reset-password-btn');
  const loginLink = document.getElementById('login-link');
  const loginLinkReset = document.getElementById('login-link-reset');
  const mensagemErro = document.getElementById('mensagem-erro');
  const emailError = document.getElementById('email-error');
  const newPasswordError = document.getElementById('new-password-error');
  const confirmPasswordError = document.getElementById('confirm-password-error');
  const senhaStatus = document.getElementById('senha-status');
  const forcaBarra = document.getElementById('forca-barra');
  const forcaTexto = document.getElementById('forca-texto');
  const senhaRequisitos = document.getElementById('senha-requisitos');
  let isSubmitting = false;
  let isResetMode = false;
  let token = null;

  const calcularForcaSenha = (senha) => {
    let pontos = 0;
    if (senha.length >= 8) pontos++;
    if (/[A-Z]/.test(senha) || /[^A-Za-z0-9]/.test(senha)) pontos++;
    if (/\d/.test(senha)) pontos++;
    return pontos;
  };

  const checkRequirement = (rule, senha) => {
    switch (rule) {
      case 'min-caracteres':
        return senha.length >= 8;
      case 'maiuscula':
        return /[A-Z]/.test(senha);
      case 'minuscula':
        return /[a-z]/.test(senha);
      case 'numero':
        return /\d/.test(senha);
      case 'especial':
        return /[^A-Za-z0-9]/.test(senha);
      case 'repeticao':
        return !/(.)\1\1/.test(senha);
      default:
        return false;
    }
  };

  const updatePasswordStrength = () => {
    const password = newPasswordInput.value.trim();
    const strength = calcularForcaSenha(password);
    const cores = ['#e63946', '#f4a261', '#2a9d8f'];
    const textos = ['Fraca', 'Média', 'Forte'];
    const porcentagens = ['33%', '66%', '100%'];

    const style = strength > 0
      ? { width: porcentagens[strength - 1], backgroundColor: cores[strength - 1], text: textos[strength - 1] }
      : { width: '0%', backgroundColor: 'transparent', text: '' };

    senhaStatus.style.display = password ? 'block' : 'none';
    senhaRequisitos.style.display = password ? 'block' : 'none';
    forcaBarra.style.width = style.width;
    forcaBarra.style.backgroundColor = style.backgroundColor;
    forcaTexto.textContent = style.text;

    ['min-caracteres', 'maiuscula', 'minuscula', 'numero', 'especial', 'repeticao'].forEach((rule) => {
      const li = document.getElementById(`req-${rule}`);
      li.className = checkRequirement(rule, password) ? 'valido' : '';
    });
  };

  const setMessage = (text) => {
    mensagemErro.textContent = text;
  };

  const clearErrors = () => {
    emailError.textContent = '';
    newPasswordError.textContent = '';
    confirmPasswordError.textContent = '';
    mensagemErro.textContent = '';
  };

  const toggleForms = () => {
    requestResetForm.style.display = isResetMode ? 'none' : 'block';
    resetPasswordForm.style.display = isResetMode ? 'block' : 'none';
  };

  const checkResetToken = async () => {
    if (token) {
      console.log('Token already processed:', token);
      return;
    }

    const hash = window.location.hash.replace('#', '');
    const hashParams = new URLSearchParams(hash);
    const error = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    const errorDescription = hashParams.get('error_description');

    if (error || errorCode || errorDescription) {
      console.log('Error in URL:', { error, errorCode, errorDescription });
      setMessage('Link de redefinição inválido ou expirado. Por favor, solicite um novo e-mail de recuperação.');
      isResetMode = false;
      token = 'error';
      toggleForms();
      return;
    }

    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    if (accessToken && type === 'recovery') {
      console.log('Valid reset token detected, verifying session');
      token = accessToken;
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          console.log('Invalid session:', error);
          setMessage('Sessão inválida ou expirada. Solicite um novo link de redefinição.');
          isResetMode = false;
          token = 'invalid';
        } else {
          console.log('Valid session, enabling reset mode');
          isResetMode = true;
          emailInput.value = session.user.email || '';
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setMessage('Erro ao verificar sessão. Tente novamente.');
        isResetMode = false;
        token = 'invalid';
      }
    } else {
      console.log('No valid reset token, setting reset mode to false');
      isResetMode = false;
      token = 'none';
    }
    toggleForms();
  };

  const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    if (event === 'SIGNED_IN' && session && token && token !== 'error' && token !== 'invalid') {
      isResetMode = true;
      emailInput.value = session.user.email || '';
    } else if (event === 'SIGNED_OUT' || !session) {
      isResetMode = false;
      setMessage('Sessão expirada. Solicite um novo link de redefinição.');
      token = 'invalid';
    }
    toggleForms();
  });

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    sendResetBtn.textContent = 'Enviando...';
    sendResetBtn.disabled = true;
    clearErrors();

    const emailValue = emailInput.value.trim();
    if (!emailValue.includes('@') || !emailValue.includes('.')) {
      setMessage('Digite um e-mail válido (ex: usuario@dominio.com)');
      isSubmitting = false;
      sendResetBtn.textContent = 'Enviar E-mail';
      sendResetBtn.disabled = false;
      return;
    }

    try {
      console.log('Sending reset email for:', emailValue);
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/esqueciSenha.html`,
      });
      if (error) throw error;
      setMessage('E-mail de recuperação enviado. Verifique sua caixa de entrada ou spam.');
      emailInput.value = '';
    } catch (err) {
      console.error('Error sending reset email:', err);
      setMessage('Erro ao enviar e-mail de recuperação: ' + (err.message || 'Tente novamente.'));
    } finally {
      isSubmitting = false;
      sendResetBtn.textContent = 'Enviar E-mail';
      sendResetBtn.disabled = false;
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    resetPasswordBtn.textContent = 'Redefinindo...';
    resetPasswordBtn.disabled = true;
    clearErrors();

    const newPasswordValue = newPasswordInput.value.trim();
    const confirmPasswordValue = confirmPasswordInput.value.trim();

    if (!newPasswordValue || !confirmPasswordValue) {
      setMessage('Preencha ambos os campos de senha.');
      isSubmitting = false;
      resetPasswordBtn.textContent = 'Redefinir Senha';
      resetPasswordBtn.disabled = false;
      return;
    }

    if (newPasswordValue !== confirmPasswordValue) {
      setMessage('As senhas não coincidem.');
      isSubmitting = false;
      resetPasswordBtn.textContent = 'Redefinir Senha';
      resetPasswordBtn.disabled = false;
      return;
    }

    const errosSenha = validatePassword(newPasswordValue, emailInput.value.trim(), '');
    if (errosSenha.length > 0) {
      setMessage('Senha inválida:\n' + errosSenha.join('\n'));
      isSubmitting = false;
      resetPasswordBtn.textContent = 'Redefinir Senha';
      resetPasswordBtn.disabled = false;
      return;
    }

    try {
      console.log('Attempting to update password');
      const { data, error } = await supabase.auth.updateUser({ password: newPasswordValue });
      console.log('Update user response:', { data, error });
      if (error) throw error;
      setMessage('Senha atualizada com sucesso! Você será redirecionado para o login.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err) {
      console.error('Error updating password:', err);
      setMessage('Erro ao atualizar senha: ' + (err.message || 'Tente novamente.'));
    } finally {
      isSubmitting = false;
      resetPasswordBtn.textContent = 'Redefinir Senha';
      resetPasswordBtn.disabled = false;
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /login');
    window.location.href = '/login';
  };

  checkResetToken();

  requestResetForm.addEventListener('submit', handleSendResetEmail);
  resetPasswordForm.addEventListener('submit', handleUpdatePassword);
  newPasswordInput.addEventListener('input', updatePasswordStrength);
  loginLink.addEventListener('click', handleLoginClick);
  loginLinkReset.addEventListener('click', handleLoginClick);

  window.addEventListener('unload', () => {
    authListener.subscription?.unsubscribe();
  });
});