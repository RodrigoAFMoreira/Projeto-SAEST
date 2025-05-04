import { auth, db } from "./firebase-config.js";
import { sendEmailVerification, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { redirecionarParaMenu, redirecionarParaVerificarEmail, redirecionarParaCadastroUser, redirecionarParaEsqueciSenha } from "./redirecionar.js";
//import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

//Check
console.log("login.js carregado com sucesso");

// Realiza login do usuário e verifica e-mail
const loginUser = async (email, senha) => {
  try {
    console.log("Tentando login com:", email, "e senha:", senha);
    // Autentica usuário com e-mail e senha
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    if (user.emailVerified) {
      // Redireciona para o menu se o e-mail estiver verificado
      console.log("Usuário logado com UID:", user.uid);
      redirecionarParaMenu();
    } else {
      //emvia e-mail de verificação e redireciona se não verificado
      await sendEmailVerification(user);
      redirecionarParaVerificarEmail();
    }
  } catch (erro) {
    // Exibe erro no console e alerta o usuário
    console.error("Erro no login:", erro.code, erro.message);
    alert("E-mail ou senha incorretos! (" + erro.message + ")");
  }
};

// Executa após o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const cadastroLink = document.getElementById("link-cadastro");
  const esqueciSenhaLink = document.getElementById("link-esqueci-senha");

  if (loginForm) {
    // Manipula submissão do formulário de login
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("email");
      const senhaInput = document.getElementById("password");

      // Valida formato do e-mail
      if (!emailInput.value.includes("@")) {
        alert("Por favor, inclua um '@' no endereço de e-mail.");
        return;
      }
      // Valida se a senha foi preenchida
      if (senhaInput.value.trim() === "") {
        alert("Por favor, insira sua senha.");
        return;
      }

      const botaoSubmit = loginForm.querySelector("button[type='submit']");
      botaoSubmit.disabled = true;

      // Executa login e reativa botão após conclusão
      loginUser(emailInput.value, senhaInput.value).finally(() => {
        botaoSubmit.disabled = false;
      });
    });
  } else {
    console.error("Formulário de login não encontrado!");
  }

  if (cadastroLink) {
    // Redireciona para página de cadastro
    cadastroLink.addEventListener("click", (e) => {
      e.preventDefault();
      redirecionarParaCadastroUser();
    });
  } else {
    console.error("Link de cadastro não encontrado!");
  }

  if (esqueciSenhaLink) {
    // Redireciona para recup senha
    esqueciSenhaLink.addEventListener("click", (e) => {
      e.preventDefault();
      redirecionarParaEsqueciSenha();
    });
  } else {
    console.error("Link de 'Esqueceu sua senha?' não encontrado!");
  }
});