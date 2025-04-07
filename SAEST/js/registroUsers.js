import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { redirecionarParaLogin } from "./redirecionar.js";

console.log("registro.js carregado");

const registrarUsuario = async (email, senha, nomeDeUsuario) => {
    try {
        console.log("Tentando registrar:", email);
        const credenciaisUsuario = await createUserWithEmailAndPassword(auth, email, senha);
        const usuario = credenciaisUsuario.user;
        console.log("Usuário autenticado com UID:", usuario.uid);
        
        await setDoc(doc(db, "users", usuario.uid), {
            email: usuario.email,
            username: nomeDeUsuario,
            criadoEm: new Date()
        });

        console.log("Usuário registrado e salvo no Firestore!");
        redirecionarParaLogin();
    } catch (erro) {
        console.error("Erro no registro:", erro.code, erro.message);
        alert("Erro ao registrar: " + erro.message);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("password").value;
            const nomeDeUsuario = document.getElementById("username").value;

            if (!email.includes("@")) {
                alert("Por favor, insira um e-mail válido.");
                return;
            }
            if (senha.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                return;
            }
            if (nomeDeUsuario.trim() === "") {
                alert("Por favor, insira um nome.");
                return;
            }

            registrarUsuario(email, senha, nomeDeUsuario);
        });
    } else {
        console.error("Formulário de cadastro não encontrado!");
    }
});
