import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from './config/supabaseClient';
import { validatePhoneNumber, validatePassword } from './componentes/validacao';
import ForcaSenha from './componentes/forcaSenha';
//import './css/configuracoes.css'; 

const Configuracoes = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setMessage('Usuário não está logado. Redirecionando para login...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const { data, error: userError } = await supabase
          .from('usuarios')
          .select('nome, email, telefone')
          .eq('id', user.id)
          .single();

        if (userError || !data) {
          setMessage('Erro ao carregar dados do usuário.');
          return;
        }

        setNome(data.nome || '');
        setEmail(data.email || user.email);
        setTelefone(data.telefone || '');
      } catch (err) {
        setMessage('Erro ao carregar dados do usuário: ' + (err.message || 'Erro desconhecido.'));
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = document.getElementById('email-error');
    const nomeError = document.getElementById('nome-error');
    const telefoneError = document.getElementById('telefone-error');

    setMessage('');
    if (emailError) emailError.textContent = '';
    if (nomeError) nomeError.textContent = '';
    if (telefoneError) telefoneError.textContent = '';
    if (!email.includes('@') || !email.includes('.')) {
      setMessage('Digite um e-mail válido (ex: usuario@dominio.com)');
      if (emailError) emailError.textContent = 'E-mail inválido.';
      return;
    }

    if (!nome) {
      setMessage('Preencha seu nome completo.');
      if (nomeError) nomeError.textContent = 'Nome é obrigatório.';
      return;
    }

    const erroTelefone = validatePhoneNumber(telefone);
    if (erroTelefone) {
      setMessage(erroTelefone);
      if (telefoneError) telefoneError.textContent = erroTelefone;
      return;
    }

    if (senha && validatePassword(senha, email, nome).length > 0) {
      const errosSenha = validatePassword(senha, email, nome);
      setMessage('Senha inválida:\n' + errosSenha.join('\n'));
      return;
    }

    try {
      setIsSubmitting(true);
      const updates = {};
      if (email) updates.email = email;
      if (senha) updates.password = senha;
      if (nome || telefone) {
        updates.data = {
          username: nome,
          telefone,
        };
      }

      const { error: authError } = await supabase.auth.updateUser(updates);
      if (authError) throw authError;

      const { error: dbError } = await supabase
        .from('usuarios')
        .update({ nome, email, telefone })
        .eq('id', (await supabase.auth.getUser()).data.user.id);

      if (dbError) throw dbError;

      setMessage('Dados atualizados com sucesso!');
      setSenha(''); 
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      setMessage('Erro ao atualizar: ' + (err.message || 'Erro desconhecido. Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="configuracoes-container">
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
            placeholder="Nova senha (opcional)"
            aria-describedby="senha-status senha-requisitos mensagem-erro"
          />
        </div>

        <ForcaSenha password={senha} email={email} nome={nome} />

        <div className="mensagem-erro" id="mensagem-erro" role="alert" aria-live="assertive">
          {message}
        </div>

        <button type="submit" disabled={isSubmitting} aria-label="Atualizar dados da conta">
          {isSubmitting ? 'Atualizando...' : 'Atualizar'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/menu')}
          aria-label="Voltar para o dashboard"
        >
          Voltar
        </button>
      </form>
    </div>
  );
};

export default Configuracoes;