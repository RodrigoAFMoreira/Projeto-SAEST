// src/cadastro.js

import AuthService from './componentes/authService.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('cadastro-form');
  const tipoUsuario = document.getElementById('tipoUsuario');
  const nome = document.getElementById('nome');
  const email = document.getElementById('email');
  const telefone = document.getElementById('telefone');
  const senha = document.getElementById('senha');
  const submitBtn = document.getElementById('submit-btn');
  const loginLink = document.getElementById('login-link');
  const mensagemErro = document.getElementById('mensagem-erro');
  const tipoError = document.getElementById('tipo-error');
  const nomeError = document.getElementById('nome-error');
  const emailError = document.getElementById('email-error');
  const telefoneError = document.getElementById('telefone-error');
  const senhaStatus = document.getElementById('senha-status');
  const forcaBarra = document.getElementById('forca-barra');
  const forcaTexto = document.getElementById('forca-texto');
  const senhaRequisitos = document.getElementById('senha-requisitos');
  let isSubmitting = false;

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

  const upadatePasswordStrength = () => {
    const password = senha.value.trim();
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

  senha.addEventListener('input', upadatePasswordStrength);
  email.addEventListener('input', upadatePasswordStrength);
  nome.addEventListener('input', upadatePasswordStrength);

  const setMessage = (text) => {
    mensagemErro.textContent = text;
  };

  const clearErrors = () => {
    tipoError.textContent = '';
    nomeError.textContent = '';
    emailError.textContent = '';
    telefoneError.textContent = '';
    mensagemErro.textContent = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    submitBtn.textContent = 'Cadastrando...';
    submitBtn.disabled = true;
    clearErrors();

    const tipoValue = tipoUsuario.value;
    const nomeValue = nome.value.trim();
    const emailValue = email.value.trim();
    const telefoneValue = telefone.value.trim();
    const senhaValue = senha.value.trim();

    try {
      await AuthService.register(emailValue, senhaValue, nomeValue, tipoValue, telefoneValue);
      window.location.href = '/verificarEmail.html';
    } catch (err) {
      console.error('Erro ao registrar:', err);
      const errorMessage = err.message.includes('409')
        ? 'Este e-mail já está registrado. Use outro e-mail ou faça login.'
        : err.message.includes('429')
        ? 'Muitas tentativas. Tente novamente em alguns minutos.'
        : err.message.includes('503')
        ? 'Problema de conexão com o servidor. Tente novamente.'
        : err.message.includes('400')
        ? `Erro ao registrar: ${err.message}`
        : `Erro ao registrar: ${err.message || 'Tente novamente.'}`;
      setMessage(errorMessage);
    } finally {
      isSubmitting = false;
      submitBtn.textContent = 'Cadastrar';
      submitBtn.disabled = false;
    }
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    console.log('Navigating to /login');
    window.location.href = '/login';
  };
  
  form.addEventListener('submit', handleSubmit);
  loginLink.addEventListener('click', handleLoginClick);
});