import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { redirecionarParaMenu } from "./redirecionar.js";

document.addEventListener("DOMContentLoaded", () => {
    console.log("login.js carregado com sucesso");

    const loginUser = async (email, senha) => {
        try {
            console.log("Tentando login com:", email, "e senha:", senha);
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            console.log("Usuário logado com UID:", userCredential.user.uid);
            redirecionarParaMenu();
        } catch (erro) {
            console.error("Erro no login:", erro.code, erro.message);
            alert("E-mail ou senha incorretos! (" + erro.message + ")");
        }
    };

    const loginForm = document.getElementById("login-form");
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
});
