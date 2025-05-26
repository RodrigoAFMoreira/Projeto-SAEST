import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  updatePassword,
  deleteUser,
  updateEmail,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  doc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { redirecionarParaLogin } from "./redirecionar.js";

// Verifica se o usuário está logado e carrega os dados
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const dados = docSnap.data();
      document.getElementById("nome").value = dados.username || "";
      document.getElementById("email").value = user.email || "";
      document.getElementById("telefone").value = dados.telefone || "";
    }
  } else {
    redirecionarParaLogin();
  }
});

// Atualiza os dados do usuário
document.getElementById("settings-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  const user = auth.currentUser;

  if (!user) {
    alert("Usuário não autenticado.");
    return;
  }

  const userRef = doc(db, "users", user.uid);

  try {
    if (email !== user.email) {
      await updateEmail(user, email);
    }

    if (senha) {
      const erros = validarSenhaRobusta(senha, email, nome);
      if (erros.length > 0) {
        alert("Senha inválida:\n" + erros.join("\n"));
        return;
      }
      await updatePassword(user, senha);
    }

    await updateDoc(userRef, {
      username: nome,
      telefone: telefone,
    });

    alert("Dados atualizados com sucesso!");
  } catch (err) {
    console.error("Erro ao atualizar dados:", err);
    alert("Erro ao atualizar: " + traduzirErroFirebase(err.code));
  }
});

// Logout
window.logout = async () => {
  await signOut(auth);
  redirecionarParaLogin();
};

// Deletar conta
document.querySelector(".btn.delete").addEventListener("click", async () => {
  const confirmacao = confirm("Tem certeza que deseja deletar sua conta? Essa ação é irreversível.");
  if (!confirmacao) return;

  const user = auth.currentUser;
  try {
    await deleteUser(user);
    alert("Conta deletada com sucesso.");
    redirecionarParaLogin();
  } catch (err) {
    console.error("Erro ao deletar conta:", err);
    alert("Erro ao deletar conta: " + traduzirErroFirebase(err.code));
  }
});

// Validação de senha
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

// Tradução de erros do Firebase
function traduzirErroFirebase(code) {
  const mensagens = {
    "auth/requires-recent-login": "Você precisa se autenticar novamente para essa ação.",
    "auth/email-already-in-use": "E-mail já está em uso.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/weak-password": "Senha fraca.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
  };
  return mensagens[code] || "Erro desconhecido.";
}
