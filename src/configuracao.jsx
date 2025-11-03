// src/configuracao.jsx
// Página de configurações do usuário (atualizar dados, alterar senha)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import { validatePhoneNumber, validatePassword } from './componentes/validacao';
import ForcaSenha from './componentes/forcaSenha';
import Sidebar from './componentes/sidebar';
import LoadingSpinner from './componentes/carregando';
import './css/configuracao.css';

const mapSupabaseErrorToHttpCode = (error) => {
  if (!error) return { code: 500, message: "Erro interno desconhecido no servidor." };

  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("invalid login") || errorMessage.includes("email not confirmed")) {
    return { code: 401, message: "Senha atual incorreta ou e-mail não verificado." };
  }
  if (errorMessage.includes("rate limit")) {
    return { code: 429, message: "Limite de tentativas excedido. Tente novamente mais tarde." };
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return { code: 503, message: "Erro de rede. Verifique sua conexão e tente novamente." };
  }
  if (errorMessage.includes("invalid")) {
    return { code: 400, message: "Dados inválidos fornecidos." };
  }
  return { code: 500, message: "Erro interno do servidor. Tente novamente mais tarde." };
};

const Configuracoes = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({ tipo: 'user', nome: '', email: '', telefone: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setMessage('');
      try {
        console.log("GET /auth/user - Obtendo dados do usuário");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("GET /auth/user - Erro 401: Usuário não autenticado", authError?.message);
          setMessage('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log("GET /usuarios - Buscando dados do usuário no banco", { userId: user.id });
        const { data, error: userError } = await supabase
          .from('usuarios')
          .select('id, nome, email, tipo, telefone')
          .eq('id', user.id)
          .single();

        if (userError || !data) {
          console.warn("GET /usuarios - Erro 404: Documento do usuário não encontrado", userError?.message);
          setUserData({ tipo: 'user', nome: '', email: user.email, telefone: '' });
        } else {
          setUserData(data);
          setNome(data.nome || '');
          setEmail(data.email || user.email);
          setTelefone(data.telefone || '');
          console.log("GET /usuarios - Sucesso, código 200", { userId: user.id });
        }

        if (data && data.tipo === 'user') {
          console.warn("GET /usuarios - Erro 403: Acesso não autorizado para tipo 'user'");
          setMessage('Acesso não autorizado para este usuário.');
          setTimeout(() => navigate('/menu'), 2000);
        }
      } catch (err) {
        console.error(`GET /auth/user - Erro ${mapSupabaseErrorToHttpCode(err).code}:`, err.message);
        setMessage(`Erro ao carregar dados do usuário: ${mapSupabaseErrorToHttpCode(err).message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      console.log("POST /auth/logout - Iniciando logout");
      const { error } = await supabase.auth.signOut();
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/logout - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("POST /auth/logout - Sucesso, código 200");
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(`POST /auth/logout - Erro ${err.code || 500}:`, err.message);
      setMessage(`Erro ao sair: ${mapSupabaseErrorToHttpCode(err).message}`);
    }
  };

  const handleConfirmPassword = async () => {
    try {
      console.log("POST /auth/verify-password - Verificando senha atual", { email });
      if (!currentPassword) {
        console.error("POST /auth/verify-password - Erro 400: Senha atual é obrigatória");
        setMessage('Por favor, insira sua senha atual.');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: currentPassword,
      });
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/verify-password - Erro ${mappedError.code}:`, error.message);
        setMessage(mappedError.message);
        return;
      }
      console.log("POST /auth/verify-password - Sucesso, código 200");
      setShowConfirmModal(false);
      setCurrentPassword('');
      handleSubmitInternal();
    } catch (err) {
      console.error(`POST /auth/verify-password - Erro ${err.code || 500}:`, err.message);
      setMessage(`Erro ao verificar senha: ${mapSupabaseErrorToHttpCode(err).message}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');
    const emailError = document.getElementById('email-error');
    const nomeError = document.getElementById('nome-error');
    const telefoneError = document.getElementById('telefone-error');

    if (emailError) emailError.textContent = '';
    if (nomeError) nomeError.textContent = '';
    if (telefoneError) telefoneError.textContent = '';

    if (!email.includes('@') || !email.includes('.')) {
      console.error("PUT /auth/update - Erro 400: E-mail inválido");
      setMessage('Digite um e-mail válido (ex: usuario@dominio.com)');
      if (emailError) emailError.textContent = 'E-mail inválido.';
      return;
    }

    if (!nome) {
      console.error("PUT /auth/update - Erro 400: Nome é obrigatório");
      setMessage('Preencha seu nome completo.');
      if (nomeError) nomeError.textContent = 'Nome é obrigatório.';
      return;
    }

    const erroTelefone = validatePhoneNumber(telefone);
    if (erroTelefone) {
      console.error("PUT /auth/update - Erro 400:", erroTelefone);
      setMessage(erroTelefone);
      if (telefoneError) telefoneError.textContent = erroTelefone;
      return;
    }

    if (showPasswordFields) {
      if (senha && validatePassword(senha, email, nome).length > 0) {
        const errosSenha = validatePassword(senha, email, nome);
        console.error("PUT /auth/update - Erro 400: Senha inválida", errosSenha);
        setMessage('Senha inválida:\n' + errosSenha.join('\n'));
        return;
      }
      if (senha !== confirmarSenha) {
        console.error("PUT /auth/update - Erro 400: Senhas não coincidem");
        setMessage('As senhas não coincidem.');
        return;
      }
    }

    console.log("PUT /auth/update - Solicitando confirmação de senha");
    setShowConfirmModal(true);
  };

  const handleSubmitInternal = async () => {
    try {
      console.log("PUT /auth/update - Iniciando atualização de dados", { email, nome, telefone, hasPassword: !!senha });
      setIsSubmitting(true);
      const updates = {};
      if (email) updates.email = email;
      if (showPasswordFields && senha) updates.password = senha;
      if (nome || telefone) {
        updates.data = {
          username: nome,
          telefone,
        };
      }

      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) {
        const mappedError = mapSupabaseErrorToHttpCode(authError);
        console.error(`PUT /auth/update - Erro ${mappedError.code}:`, authError.message);
        throw new Error(mappedError.message);
      }

      console.log("PUT /usuarios - Atualizando dados no banco", { userId: (await supabase.auth.getUser()).data.user.id });
      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ nome, email, telefone })
        .eq('id', (await supabase.auth.getUser()).data.user.id);

      if (dbError) {
        console.error(`PUT /usuarios - Erro ${mapSupabaseErrorToHttpCode(dbError).code}:`, dbError.message);
        throw new Error(mapSupabaseErrorToHttpCode(dbError).message);
      }

      console.log("PUT /auth/update - Sucesso, código 204");
      setMessage('Dados atualizados com sucesso!');
      setSenha('');
      setConfirmarSenha('');
      setShowPasswordFields(false);
    } catch (err) {
      console.error(`PUT /auth/update - Erro ${err.code || 500}:`, err.message);
      setMessage(`Erro ao atualizar: ${mapSupabaseErrorToHttpCode(err).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ message, onRetry }) => (
    <div className="error-container">
      <p>{message}</p>
      <button onClick={onRetry}>Tentar novamente</button>
    </div>
  );

  return (
    <div className="container">
      {loading ? (
        <LoadingSpinner />
      ) : message && message.includes('Erro') && !showConfirmModal ? (
        <ErrorMessage message={message} onRetry={() => window.location.reload()} />
      ) : userData ? (
        <div className="dashboard-wrapper">
          <Sidebar userType={userData.tipo} userEmail={userData.email} />

          <main className="main-content">
            <header className="main-header">
              <div className="header-content">
                <div className="header-icons">
                  <i className="ri-notification-3-line"></i>
                </div>
              </div>
            </header>
            <section className="section">
              <h2>Configurações da Conta</h2>
              <p>Atualize suas informações pessoais abaixo:</p>
              <form id="configuracoes-form" onSubmit={handleSubmit} noValidate aria-describedby="mensagem-erro">
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
                    aria-label="Nome completo"
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
                    aria-label="E-mail"
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
                    aria-label="Telefone"
                  />
                  <span id="telefone-error" className="input-error" aria-live="polite"></span>
                </div>

                <div className="input-group">
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    aria-label={showPasswordFields ? "Cancelar alteração de senha" : "Alterar senha"}
                  >
                    {showPasswordFields ? 'Cancelar Alteração de Senha' : 'Alterar Senha'}
                  </button>
                </div>

                {showPasswordFields && (
                  <>
                    <div className="input-group">
                      <input
                        type="password"
                        id="senha"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value.trim())}
                        placeholder="Nova senha"
                        aria-describedby="senha-status senha-requisitos mensagem-erro"
                        aria-label="Nova senha"
                      />
                    </div>
                    <div className="input-group">
                      <input
                        type="password"
                        id="confirmar-senha"
                        value={confirmarSenha}
                        onChange={(e) => setConfirmarSenha(e.target.value.trim())}
                        placeholder="Confirmar nova senha"
                        aria-describedby="mensagem-erro"
                        aria-label="Confirmar nova senha"
                      />
                    </div>
                    <ForcaSenha password={senha} email={email} nome={nome} />
                  </>
                )}

                <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
                  {message}
                </div>

                <div className="form-buttons">
                  <button type="submit" disabled={isSubmitting} aria-label="Atualizar dados da conta">
                    {isSubmitting ? 'Atualizando...' : 'Atualizar'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Sair da conta"
                    className="logout-btn"
                  >
                    Sair
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/menu')}
                    aria-label="Voltar para o dashboard"
                  >
                    Voltar
                  </button>
                </div>
              </form>

              {showConfirmModal && (
                <div className="modal" role="dialog" aria-labelledby="modal-title">
                  <div className="modal-content">
                    <h3 id="modal-title">Confirme sua Senha Atual</h3>
                    <p>Por favor, insira sua senha atual para prosseguir com as alterações.</p>
                    <div className="input-group">
                      <input
                        type="password"
                        id="current-password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value.trim())}
                        placeholder="Senha atual"
                        required
                        aria-required="true"
                        aria-describedby="current-password-error"
                        aria-label="Senha atual"
                      />
                      <span id="current-password-error" className="input-error" aria-live="polite"></span>
                    </div>
                    <div className="modal-buttons">
                      <button
                        type="button"
                        onClick={handleConfirmPassword}
                        disabled={!currentPassword}
                        aria-label="Confirmar senha atual"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowConfirmModal(false);
                          setCurrentPassword('');
                          setMessage('');
                        }}
                        aria-label="Cancelar"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </main>
        </div>
      ) : null}
    </div>
  );
};

export default Configuracoes;