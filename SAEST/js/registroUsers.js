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
        
        console.log("Salvando dados no Firestore para UID:", usuario.uid);
        await setDoc(doc(db, "users", usuario.uid), {
            email: usuario.email,
            username: nomeDeUsuario,
            criadoEm: new Date()
        });
        console.log("Dados salvos no Firestore com sucesso");

        console.log("Usuário registrado e salvo no Firestore!");
        redirecionarParaLogin();
    } catch (erro) {
        console.error("Erro no registro:", erro.code, erro.message);
        alert("Erro ao registrar: " + erro.message);
        throw erro;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, buscando formulário");
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        console.log("Formulário encontrado, adicionando listener");
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const senha = document.getElementById("password").value;
            const nomeDeUsuario = document.getElementById("username").value;

            console.log("Formulário enviado com:", email, senha, nomeDeUsuario);

            if (!email.includes("@")) {
                alert("Por favor, inclua um '@' no endereço de e-mail.");
                console.log("Validação falhou: email sem @");
                return;
            }
            if (senha.length < 6) {
                alert("A senha deve ter pelo menos 6 caracteres.");
                console.log("Validação falhou: senha muito curta");
                return;
            }
            if (nomeDeUsuario.trim() === "") {
                alert("Por favor, insira um nome de usuário.");
                console.log("Validação falhou: username vazio");
                return;
            }

            registrarUsuario(email, senha, nomeDeUsuario);
        });
    } else {
        console.error("Formulário de registro não encontrado!");
    }
});