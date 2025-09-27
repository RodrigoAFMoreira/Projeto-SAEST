// src/services/AuthService.js
import supabase from "../config/supabaseClient";
import { validatePhoneNumber, validatePassword } from "./validacao";

class AuthService {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw new Error(error.message || "Erro ao fazer login.");

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
      console.error("Erro no login:", error);
      throw error;
    }
  }

  async register(email, password, nome, tipo, telefone) {
    try {
      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Digite um e-mail válido (ex: usuario@dominio.com)");
      }
      if (!nome) {
        throw new Error("Preencha seu nome completo.");
      }
      const erroTelefone = validatePhoneNumber(telefone);
      if (erroTelefone) {
        throw new Error(erroTelefone);
      }
      if (!tipo) {
        throw new Error("Selecione o tipo de usuário.");
      }
      const errosSenha = validatePassword(password, email, nome);
      if (errosSenha.length > 0) {
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

      if (error) throw new Error(error.message || "Erro ao registrar usuário.");

      const { user } = data;
      if (user) {
        const { error: insertError } = await supabase.from("usuarios").insert({
          id: user.id,
          nome,
          email,
          tipo,
          telefone,
        });

        if (insertError) throw new Error(insertError.message || "Erro ao salvar dados do usuário.");

        return {
          id: user.id,
          email: user.email,
          nome,
          tipo,
          telefone,
        };
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      throw error;
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message || "Erro ao fazer logout.");
    } catch (error) {
      console.error("Erro no logout:", error);
      throw error;
    }
  }

  async getToken() {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token || null;
    } catch (error) {
      console.error("Erro ao obter token:", error);
      return null;
    }
  }

  async getCurrentUser() {
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const tipo = data.user.user_metadata?.tipo || (await this.getUserTipo(data.user.id));
        return {
          id: data.user.id,
          email: data.user.email,
          nome: data.user.user_metadata?.username,
          tipo,
          telefone: data.user.user_metadata?.telefone,
        };
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter usuário atual:", error);
      return null;
    }
  }

  async getUserTipo(userId) {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("tipo")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data?.tipo || null;
    } catch (error) {
      console.error("Erro ao obter tipo do usuário:", error);
      return null;
    }
  }

  async resetPassword(email) {
    try {
      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Digite um e-mail válido (ex: usuario@dominio.com)");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/resetar-senha`,
      });

      if (error) throw new Error(error.message || "Erro ao enviar e-mail de recuperação.");
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
      throw error;
    }
  }
}

export default new AuthService();
