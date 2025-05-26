import { auth, db } from "./firebase-config.js";
import {
  sendEmailVerification,
  createUserWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  redirecionarParaLogin,
  redirecionarParaVerificarEmail,
} from "./redirecionar.js";

// Validação de senha forte
function validarSenhaRobusta(senha, email, nome) {
  const erros = [];

  if (senha.length < 8) erros.push("Mínimo de 8 caracteres.");
  if (!/[A-Z]/.test(senha)) erros.push("Deve conter ao menos 1 letra maiúscula.");
  if (!/[a-z]/.test(senha)) erros.push("Deve conter ao menos 1 letra minúscula.");
  if (!/[0-9]/.test(senha)) erros.push("Deve conter ao menos 1 número.");
  if (!/[^A-Za-z0-9]/.test(senha)) erros.push("Deve conter ao menos 1 caractere especial.");
  if (/(.)\1{2,}/.test(senha)) erros.push("Não repita o mesmo caractere em sequência (ex: aaa).");

  const nomeLimpo = nome.toLowerCase().replace(/\s+/g, "");
  const emailParte = email.split("@")[0].toLowerCase();

  if (senha.toLowerCase().includes(nomeLimpo) || senha.toLowerCase().includes(emailParte)) {
    erros.push("A senha não deve conter seu nome ou e-mail.");
  }

  return erros;
}

// Exibir mensagem de erro
function exibirMensagem(mensagem, cor = "red") {
  const msgDiv = document.getElementById("mensagem-erro");
  msgDiv.textContent = mensagem;
  msgDiv.style.color = cor;
}

// Registrar usuário no Firebase
const registrarUsuario = async (email, senha, nome, tipo) => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const user = cred.user;

    await sendEmailVerification(user);

    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      username: nome,
      tipo: tipo,
      criadoEm: new Date(),
    });

    // Redirecionar conforme o tipo
    if (tipo === "administrador") {
      window.location.href = "../menu.html";
    } else if (tipo === "funcionario") {
      window.location.href = "../menuFuncionario.html";
    } else if (tipo === "gestor") {
      window.location.href = "../menu.html";  
    } else {
      // fallback
      window.location.href = "../index.html";
    }

  } catch (err) {
    console.error("Erro ao registrar:", err.code, err.message);
    exibirMensagem("Erro ao registrar: " + traduzirErroFirebase(err.code));
  }
};


// Tradução de erros do Firebase
function traduzirErroFirebase(code) {
  const mensagens = {
    "auth/email-already-in-use": "E-mail já está em uso.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "Senha fraca.",
  };
  return mensagens[code] || "Erro desconhecido. Tente novamente.";
}

// Início
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("cadastro-form");

  if (!form) {
    console.error("Formulário não encontrado.");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const tipo = document.getElementById("tipoUsuario").value;
    const msgErro = document.getElementById("mensagem-erro");

    msgErro.textContent = ""; // Limpa mensagens anteriores

    if (!email.includes("@") || !email.includes(".")) {
      exibirMensagem("Digite um e-mail válido (ex: usuario@dominio.com)");
      return;
    }

    if (!nome) {
      exibirMensagem("Preencha seu nome completo.");
      return;
    }

    if (!tipo) {
      exibirMensagem("Selecione o tipo de usuário.");
      return;
    }

    const errosSenha = validarSenhaRobusta(senha, email, nome);
    if (errosSenha.length > 0) {
      exibirMensagem("Senha inválida:\n" + errosSenha.join("\n"));
      return;
    }

    registrarUsuario(email, senha, nome, tipo);
  });

  // Redirecionar para login
  const linkLogin = document.querySelector(".register-link a");
  if (linkLogin) {
    linkLogin.addEventListener("click", (e) => {
      e.preventDefault();
      redirecionarParaLogin();
    });
  }
});
