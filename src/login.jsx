import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./config/supabaseClient";

const Login = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const loginUser = async (email, senha) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) throw error;

      const user = data.user;

      if (user.email_confirmed_at) {
        navigate("/menu");
      } else {
        navigate("/verificar-email");
        await supabase.auth.resend({ type: "signup", email });
      }
    } catch (erro) {
      console.error("Erro no login:", erro.message);
      alert("E-mail ou senha incorretos! (" + erro.message + ")");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes("@")) {
      alert("Por favor, inclua um '@' no endereço de e-mail.");
      return;
    }

    if (senha.trim() === "") {
      alert("Por favor, insira sua senha.");
      return;
    }

    await loginUser(email, senha);
  };

  const handleCadastroClick = (e) => {
    e.preventDefault();
    navigate("/cadastro");
  };

  const handleEsqueciSenhaClick = (e) => {
    e.preventDefault();
    navigate("/esqueciSenha"); 
  };

  return (
    <div className="container">
      <div className="left-section">
        <h1>SAEST</h1>
        <p>Protegendo pessoas, fortalecendo negócios</p>
      </div>
      <div className="right-section">
        <div className="login-container">
          <h2>Login</h2>
          <p>Acesse sua conta para continuar</p>
          <form id="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                id="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Senha"
                required
              />
            </div>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <a href="#" id="link-esqueci-senha" onClick={handleEsqueciSenhaClick}>
            Esqueceu sua senha?
          </a>
          <a href="#" id="link-cadastro" onClick={handleCadastroClick}>
            Não tem uma conta? Registre-se
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;