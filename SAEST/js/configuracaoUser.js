import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updateEmail } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Função para validar o formato do e-mail
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return re.test(String(email).toLowerCase());
}

// Função para carregar dados do usuário
async function loadUserData(user) {
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const userNameDiv = document.querySelector(".user-profile .name");
  const userEmailDiv = document.querySelector(".user-profile .email");

  if (user) {
    // Atualiza o perfil na barra lateral
    if (userNameDiv) userNameDiv.textContent = user.displayName || "Usuário";
    if (userEmailDiv) userEmailDiv.textContent = user.email || "email@não.disponível";

    // Busca dados adicionais do Firestore
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Dados do usuário carregados:", userData);
        // Preenche os campos do formulário
        if (nomeInput) nomeInput.value = userData.username || "";
        if (emailInput) emailInput.value = userData.email || user.email;
      } else {
        console.warn("Documento do usuário não encontrado no Firestore.");
        // Preenche com dados do Firebase Authentication como fallback
        if (nomeInput) nomeInput.value = "";
        if (emailInput) emailInput.value = user.email || "";
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      alert("Erro ao carregar dados do usuário.");
    }
  }
}

// Configura o listener do formulário
document.getElementById("settings-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const emailNovo = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  // Validações
  if (!validateEmail(emailNovo)) {
    alert("Por favor, insira um e-mail válido.");
    return;
  }
  if (nome === "") {
    alert("Por favor, insira um nome.");
    return;
  }
  if (senha === "") {
    alert("Por favor, insira a senha atual para confirmar as alterações.");
    return;
  }

  const user = auth.currentUser;

  if (user) {
    try {
      // Reautentica o usuário
      const credenciais = EmailAuthProvider.credential(user.email, senha);
      await reauthenticateWithCredential(user, credenciais);

      // Atualiza o e-mail no Firebase Authentication
      if (emailNovo !== user.email) {
        await updateEmail(user, emailNovo);
        console.log("E-mail atualizado no Firebase Authentication:", emailNovo);
      }

      // Atualiza os dados no Firestore
      await updateDoc(doc(db, "users", user.uid), {
        username: nome,
        email: emailNovo,
        atualizadoEm: new Date()
      });
      console.log("Dados atualizados no Firestore:", { username: nome, email: emailNovo });

      // Atualiza o perfil na barra lateral
      const userNameDiv = document.querySelector(".user-profile .name");
      const userEmailDiv = document.querySelector(".user-profile .email");
      if (userNameDiv) userNameDiv.textContent = nome;
      if (userEmailDiv) userEmailDiv.textContent = emailNovo;

      alert("Dados atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      if (error.code === "auth/wrong-password") {
        alert("Senha incorreta. Verifique a senha atual.");
      } else if (error.code === "auth/email-already-in-use") {
        alert("Este e-mail já está em uso por outra conta.");
      } else {
        alert("Erro ao atualizar dados: " + error.message);
      }
    }
  } else {
    alert("Nenhum usuário autenticado.");
  }
});

// Monitora o estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuário logado:", user.uid);
    loadUserData(user);
  } else {
    console.log("Usuário não está logado, redirecionando para login.");
    window.location.href = "/login";
  }
});