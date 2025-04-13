import { auth, db } from "./firebase-config.js";
import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { createUserWithEmailAndPassword, signOut  } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { redirecionarParaLogin, redirecionarParaVerificarEmail } from "./redirecionar.js";

console.log("registro.js carregado");

const registrarUsuario = async (email, senha, nomeDeUsuario) => {
    try {
        console.log("Tentando registrar:", email);
        const credenciaisUsuario = await createUserWithEmailAndPassword(auth, email, senha)
        console.log(credenciaisUsuario)
        const user = credenciaisUsuario.user
        await sendEmailVerification(user)
        const usuario = credenciaisUsuario.user;
        console.log("Usuário autenticado com UID:", usuario.uid);
        console.log(credenciaisUsuario)
        
        await setDoc(doc(db, "users", usuario.uid), {
            email: usuario.email,
            username: nomeDeUsuario,
            criadoEm: new Date()
        });

        await signOut(auth);

        redirecionarParaVerificarEmail();
    } catch (erro) {
        console.error("Erro no registro:", erro.code, erro.message);
        alert("Erro ao registrar: " + erro.message);
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("cadastro-form");

    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const email = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            const nomeDeUsuario = document.getElementById("nome").value;
            const partesEmail = email.split("@");

            if (!email.includes("@")) {
                alert("Por favor, insira um e-mail válido.");
                return;
            }

            if (partesEmail.length !== 2 || partesEmail[1].trim() === "") {
                alert("Por favor, insira um domínio após o '@'. Exemplo: usuario@exemplo.com");
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
