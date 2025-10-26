// Em uso em login, registro, resetSenha, navbar
// Serviço de autenticação usando Supabase

import supabase from "../config/supabaseClient";
import { validatePhoneNumber, validatePassword } from "./validacao";

const mapSupabaseErrorToHttpCode = (error) => {
  if (!error) return { code: 500, message: "Erro interno desconhecido no servidor." };

  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("invalid login") || errorMessage.includes("email not confirmed")) {
    return { code: 401, message: "Credenciais inválidas ou e-mail não verificado." };
  }
  if (errorMessage.includes("user already registered") || errorMessage.includes("email exists")) {
    return { code: 409, message: "Usuário já registrado com este e-mail." };
  }
  if (errorMessage.includes("rate limit")) {
    return { code: 429, message: "Limite de tentativas excedido. Tente novamente mais tarde." };
  }
  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return { code: 503, message: "Erro de rede. Verifique sua conexão e tente novamente." };
  }
  return { code: 500, message: "Erro interno do servidor. Tente novamente mais tarde." };
};

class AuthService {
  async login(email, password) {
    try {
      console.log("POST /auth/login - Iniciando login", { email });
      if (!email || !password) {
        throw new Error("E-mail e senha são obrigatórios.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/login - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }

      console.log("POST /auth/login - Sucesso, código 200");
      const { user, session } = data;
      return {
        token: session?.access_token,
        user: {
          id: user.id,
          email: user.email,
          tipo: user.user_metadata?.tipo || (await this.getUserTipo(user.id)),
          nome: user.user_metadata?.username,
          telefone: user.user_metadata?.telefone,
        },
      };
    } catch (error) {
      console.error(`POST /auth/login - Erro ${error.code || 500}:`, error.message);
      throw new Error(error.message || "Erro ao fazer login. Tente novamente.");
    }
  }

  async register(email, password, nome, tipo, telefone) {
    try {
      console.log("POST /auth/register - Iniciando cadastro", { email, nome, tipo, telefone });
      
      if (!email.includes("@") || !email.includes(".")) {
        console.error("POST /auth/register - Erro 400: E-mail inválido");
        throw new Error("Digite um e-mail válido (ex: usuario@dominio.com)");
      }
      if (!nome) {
        console.error("POST /auth/register - Erro 400: Nome é obrigatório");
        throw new Error("Preencha seu nome completo.");
      }
      const erroTelefone = validatePhoneNumber(telefone);
      if (erroTelefone) {
        console.error("POST /auth/register - Erro 400:", erroTelefone);
        throw new Error(erroTelefone);
      }
      if (!tipo) {
        console.error("POST /auth/register - Erro 400: Tipo de usuário é obrigatório");
        throw new Error("Selecione o tipo de usuário.");
      }
      const errosSenha = validatePassword(password, email, nome);
      if (errosSenha.length > 0) {
        console.error("POST /auth/register - Erro 400: Senha inválida", errosSenha);
        throw new Error("Senha inválida:\n" + errosSenha.join("\n"));
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: nome,
            tipo,
            telefone,
            criadoEm: new Date().toISOString(),
          },
        },
      });

      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/register - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }

      const { user } = data;
      if (user) {
        const { error: insertError } = await supabase.from("usuarios").insert({
          id: user.id,
          nome,
          email,
          tipo,
          telefone,
        });

        if (insertError) {
          console.error("POST /auth/register - Erro 500: Falha ao salvar dados do usuário", insertError.message);
          throw new Error("Erro ao salvar dados do usuário. Tente novamente.");
        }

        console.log("POST /auth/register - Sucesso, código 201");
        return {
          id: user.id,
          email: user.email,
          nome,
          tipo,
          telefone,
        };
      }
    } catch (error) {
      console.error(`POST /auth/register - Erro ${error.code || 500}:`, error.message);
      throw new Error(error.message || "Erro ao registrar usuário. Tente novamente.");
    }
  }

  async logout() {
    try {
      console.log("POST /auth/logout - Iniciando logout");
      const { error } = await supabase.auth.signOut();
      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/logout - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("POST /auth/logout - Sucesso, código 200");
    } catch (error) {
      console.error(`POST /auth/logout - Erro ${error.code || 500}:`, error.message);
      throw new Error(error.message || "Erro ao fazer logout. Tente novamente.");
    }
  }

  async getToken() {
    try {
      console.log("GET /auth/token - Obtendo token");
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        console.error("GET /auth/token - Erro 401: Nenhuma sessão encontrada");
        return null;
      }
      console.log("GET /auth/token - Sucesso, código 200");
      return data.session.access_token;
    } catch (error) {
      console.error(`GET /auth/token - Erro ${error.code || 500}:`, error.message);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      console.log("GET /auth/user - Obtendo usuário atual");
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        console.error("GET /auth/user - Erro 401: Nenhum usuário autenticado");
        return null;
      }
      const tipo = data.user.user_metadata?.tipo || (await this.getUserTipo(data.user.id));
      console.log("GET /auth/user - Sucesso, código 200");
      return {
        id: data.user.id,
        email: data.user.email,
        nome: data.user.user_metadata?.username,
        tipo,
        telefone: data.user.user_metadata?.telefone,
      };
    } catch (error) {
      console.error(`GET /auth/user - Erro ${error.code || 500}:`, error.message);
      return null;
    }
  }

  async getUserTipo(userId) {
    try {
      console.log("GET /usuarios/tipo - Obtendo tipo de usuário", { userId });
      const { data, error } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("id", userId)
        .single();

      if (error) {
        console.error(`GET /usuarios/tipo - Erro ${error.code || 500}:`, error.message);
        throw error;
      }
      console.log("GET /usuarios/tipo - Sucesso, código 200");
      return data?.tipo || null;
    } catch (error) {
      console.error(`GET /usuarios/tipo - Erro ${error.code || 500}:`, error.message);
      return null;
    }
  }

  async resetPassword(email) {
    try {
      console.log("POST /auth/reset-password - Iniciando recuperação de senha", { email });
      if (!email.includes("@") || !email.includes(".")) {
        console.error("POST /auth/reset-password - Erro 400: E-mail inválido");
        throw new Error("Digite um e-mail válido (ex: usuario@dominio.com)");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetar-senha`,
      });

      if (error) {
        const mappedError = mapSupabaseErrorToHttpCode(error);
        console.error(`POST /auth/reset-password - Erro ${mappedError.code}:`, error.message);
        throw new Error(mappedError.message);
      }
      console.log("POST /auth/reset-password - Sucesso, código 200");
    } catch (error) {
      console.error(`POST /auth/reset-password - Erro ${error.code || 500}:`, error.message);
      throw new Error(error.message || "Erro ao enviar e-mail de recuperação. Tente novamente.");
    }
  }
}

export default new AuthService();