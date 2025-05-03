import { auth, db } from "./firebase-config.js";
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { redirecionarParaMenu, redirecionarParaVerificarEmail, redirecionarParaCadastroUser, redirecionarParaEsqueciSenha } from "./redirecionar.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js carregado com sucesso");

    const loginUser = async (email, senha) => {
        try {
            console.log("Tentando login com:", email, "e senha:", senha);
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);

            if (userCredential.user.emailVerified) {
                console.log("Usuário logado com UID:", userCredential.user.uid);
                redirecionarParaMenu();
            } else {
                const user = userCredential.user;
                await sendEmailVerification(user).then(() => redirecionarParaVerificarEmail());
            }

            console.log(userCredential);
            return;
        } catch (erro) {
            console.error("Erro no login:", erro.code, erro.message);
            alert("E-mail ou senha incorretos! (" + erro.message + ")");
        }
    };

    const loginForm = document.getElementById("login-form");
    const cadastroLink = document.getElementById("link-cadastro");
    const esqueciSenhaLink = document.getElementById("link-esqueci-senha");

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("email");
            const senhaInput = document.getElementById("password");

            if (!emailInput.value.includes("@")) {
                alert("Por favor, inclua um '@' no endereço de e-mail.");
                return;
            }
            if (senhaInput.value.trim() === "") {
                alert("Por favor, insira sua senha.");
                return;
            }

            const botaoSubmit = loginForm.querySelector("button[type='submit']");
            botaoSubmit.disabled = true;

            loginUser(emailInput.value, senhaInput.value).finally(() => {
                botaoSubmit.disabled = false;
            });
        });
    } else {
        console.error("Formulário de login não encontrado!");
    }

    if (cadastroLink) {
        cadastroLink.addEventListener("click", (e) => {
            e.preventDefault();
            redirecionarParaCadastroUser();
        });
    } else {
        console.error("Link de cadastro não encontrado!");
    }

    if (esqueciSenhaLink) {
        esqueciSenhaLink.addEventListener("click", (e) => {
            e.preventDefault();
            redirecionarParaEsqueciSenha();
        });
    } else {
        console.error("Link de 'Esqueceu sua senha?' não encontrado!");
    }
});